import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { HeadcountStatus, Prisma, ServiceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { UpsertHeadcountSchema, type UpsertHeadcountInput } from './dto/headcount.schema';

const WAT_OFFSET_MS = 60 * 60 * 1000;

export type ServiceState = 'SCHEDULED' | 'LIVE' | 'ENDED';

type HeadcountRow = Prisma.ServiceHeadcountGetPayload<{}>;

@Injectable()
export class HeadcountService {
  private readonly logger = new Logger(HeadcountService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Current time, honouring ATTENDANCE_TEST_NOW so headcount + check-in share a clock. */
  private getNow(): Date {
    const override = this.config.get('ATTENDANCE_TEST_NOW', { infer: true });
    return override?.trim() ? new Date(override.trim()) : new Date();
  }

  /**
   * Derive a service's lifecycle state. A headcount may only be recorded once the
   * service is LIVE or ENDED, never while still SCHEDULED. Signals, in order:
   * an explicit close (ENDED), an open flag or ATTENDANCE_FORCE_OPEN (LIVE), or
   * the clock passing openAt / scheduledAt (started).
   */
  serviceState(svc: { scheduledAt: Date; openAt: Date | null; closeAt: Date | null; isOpen: boolean }): ServiceState {
    const now = this.getNow();
    if (svc.closeAt && now >= svc.closeAt) return 'ENDED';
    if (svc.isOpen) return 'LIVE';
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true) return 'LIVE';
    const started = (svc.openAt && now >= svc.openAt) || now >= svc.scheduledAt;
    return started ? 'LIVE' : 'SCHEDULED';
  }

  private variance(hc: HeadcountRow) {
    if (hc.reportedTotal == null || hc.reportedTotal === hc.total) return null;
    return { hasVariance: true, reportedTotal: hc.reportedTotal, computedTotal: hc.total, delta: hc.reportedTotal - hc.total };
  }

  /** Shape a row for the API: adds derived children, variance, and an edited flag. */
  private toDto(hc: HeadcountRow) {
    const edited = hc.updatedAt.getTime() - hc.recordedAt.getTime() > 2000;
    return {
      id: hc.id,
      serviceId: hc.serviceId,
      men: hc.men,
      women: hc.women,
      boys: hc.boys,
      girls: hc.girls,
      children: hc.boys + hc.girls, // derived, never stored
      firstTimers: hc.firstTimers,
      total: hc.total, // = men+women+boys+girls; first-timers are an overlapping subset, not added
      reportedTotal: hc.reportedTotal,
      notes: hc.notes,
      status: hc.status,
      recordedBy: hc.recordedBy,
      recordedAt: hc.recordedAt.toISOString(),
      updatedAt: hc.updatedAt.toISOString(),
      edited,
      variance: this.variance(hc),
    };
  }

  private async serviceOrThrow(serviceId: string) {
    const svc = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId: this.tenantId },
      select: { id: true, name: true, serviceType: true, scheduledAt: true, openAt: true, closeAt: true, isOpen: true },
    });
    if (!svc) throw new NotFoundException('Service not found');
    return svc;
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  /** The headcount for a service (or null), plus the service and whether it can be recorded now. */
  async getForService(serviceId: string) {
    const svc = await this.serviceOrThrow(serviceId);
    const state = this.serviceState(svc);
    const hc = await this.prisma.serviceHeadcount.findUnique({ where: { serviceId } });
    return {
      service: {
        id: svc.id,
        name: svc.name,
        serviceType: svc.serviceType,
        scheduledAt: svc.scheduledAt.toISOString(),
        state,
      },
      canRecord: state !== 'SCHEDULED',
      headcount: hc ? this.toDto(hc) : null,
    };
  }

  /** Recent confirmed + draft headcounts for the tenant, newest first, for the history view. */
  async getHistory(limit = 30) {
    const rows = await this.prisma.serviceHeadcount.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { Service: { scheduledAt: 'desc' } },
      take: Math.min(Math.max(limit, 1), 100),
      include: { Service: { select: { name: true, serviceType: true, scheduledAt: true } } },
    });
    return rows.map((hc) => ({
      ...this.toDto(hc),
      serviceName: hc.Service.name,
      serviceType: hc.Service.serviceType,
      serviceDate: hc.Service.scheduledAt.toISOString(),
    }));
  }

  /** Today's service headcount total (congregation-level "present today" number). */
  async getTodayHeadcount() {
    const now = this.getNow();
    const localNow = new Date(now.getTime() + WAT_OFFSET_MS);
    const midnight = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
    const startUtc = new Date(midnight - WAT_OFFSET_MS);
    const endUtc = new Date(startUtc.getTime() + 86_400_000);
    const svc = await this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true },
    });
    if (!svc) return { total: null as number | null, headcount: null };
    const hc = await this.prisma.serviceHeadcount.findUnique({ where: { serviceId: svc.id } });
    return { total: hc?.total ?? null, headcount: hc ? this.toDto(hc) : null };
  }

  /**
   * Attendance trend from headcount totals. Points are chronological and tagged by
   * service type, so callers can compare like service to like service. Only
   * CONFIRMED headcounts count as authoritative. Includes the category breakdown
   * (men / women / children / first-timers) for the growth surface.
   */
  async getTrend(opts: { serviceType?: ServiceType; limit?: number } = {}) {
    const limit = Math.min(Math.max(opts.limit ?? 24, 1), 100);
    const rows = await this.prisma.serviceHeadcount.findMany({
      where: {
        tenantId: this.tenantId,
        status: HeadcountStatus.CONFIRMED,
        ...(opts.serviceType ? { Service: { serviceType: opts.serviceType } } : {}),
      },
      orderBy: { Service: { scheduledAt: 'desc' } },
      take: limit,
      include: { Service: { select: { name: true, serviceType: true, scheduledAt: true } } },
    });
    return rows
      .slice()
      .reverse()
      .map((hc) => ({
        id: hc.id,
        serviceType: hc.Service.serviceType,
        date: hc.Service.scheduledAt.toISOString(),
        label: hc.Service.scheduledAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }),
        value: hc.total,
        men: hc.men,
        women: hc.women,
        children: hc.boys + hc.girls,
        firstTimers: hc.firstTimers,
      }));
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  /**
   * Create or update the authoritative headcount for a service. total is computed
   * here (never trusted from the client); firstTimers must not exceed it. Recording
   * is blocked until the service is LIVE or ENDED. Every write is audited.
   */
  async upsert(serviceId: string, rawBody: unknown, actor: { id?: string | null }) {
    const parsed = UpsertHeadcountSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid headcount',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const body: UpsertHeadcountInput = parsed.data;

    const svc = await this.serviceOrThrow(serviceId);
    if (this.serviceState(svc) === 'SCHEDULED') {
      throw new BadRequestException('This service has not started yet. A headcount can only be recorded once the service is live.');
    }

    const total = body.men + body.women + body.boys + body.girls;
    if (body.firstTimers > total) {
      throw new BadRequestException('First-timers cannot exceed the total present (they are counted within it, not added to it).');
    }

    const existing = await this.prisma.serviceHeadcount.findUnique({ where: { serviceId } });
    const status = body.confirm ? HeadcountStatus.CONFIRMED : existing?.status ?? HeadcountStatus.DRAFT;

    const data = {
      men: body.men,
      women: body.women,
      boys: body.boys,
      girls: body.girls,
      firstTimers: body.firstTimers,
      total,
      reportedTotal: body.reportedTotal ?? null,
      notes: body.notes ?? null,
      status,
      recordedBy: actor.id ?? null,
    };

    let row: HeadcountRow;
    let action: 'CREATE' | 'UPDATE' | 'CONFIRM';
    if (existing) {
      row = await this.prisma.serviceHeadcount.update({
        where: { serviceId },
        data,
      });
      action = body.confirm && existing.status !== HeadcountStatus.CONFIRMED ? 'CONFIRM' : 'UPDATE';
    } else {
      row = await this.prisma.serviceHeadcount.create({
        data: { id: randomUUID(), tenantId: this.tenantId, serviceId, recordedAt: new Date(), ...data },
      });
      action = 'CREATE';
    }

    await this.writeAudit({
      action,
      entityId: row.id,
      actorId: actor.id ?? null,
      before: existing ? this.auditSnapshot(existing) : undefined,
      after: this.auditSnapshot(row),
    });

    return this.toDto(row);
  }

  private auditSnapshot(hc: HeadcountRow): Prisma.InputJsonValue {
    return {
      men: hc.men, women: hc.women, boys: hc.boys, girls: hc.girls,
      firstTimers: hc.firstTimers, total: hc.total, reportedTotal: hc.reportedTotal,
      status: hc.status, notes: hc.notes,
    };
  }

  private async writeAudit(entry: {
    action: string;
    entityId?: string | null;
    actorId?: string | null;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entity: 'ServiceHeadcount',
          entityId: entry.entityId ?? null,
          before: entry.before ?? Prisma.DbNull,
          after: entry.after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      // Audit must never break the mutation it records.
      this.logger.error(`Audit write failed (${entry.action} ServiceHeadcount): ${(err as Error).message}`);
    }
  }
}
