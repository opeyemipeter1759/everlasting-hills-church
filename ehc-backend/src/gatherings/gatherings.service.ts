import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import {
  addDays,
  buildGatheringOccurrenceStart,
  localCalendarDate,
  ruleOccursOn,
} from '../calendar/services/recurrence.util';
import type { CreateGatheringInput, UpdateGatheringInput } from './gatherings.schemas';

export interface GatheringView {
  id: string;
  title: string;
  description: string | null;
  recurrenceRule: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  joinUrl: string | null;
  isActive: boolean;
  /** ISO instant of the next occurrence, or null when none is scheduled. */
  nextOccurrenceAt: string | null;
  /** True when now falls inside an occurrence. */
  isLive: boolean;
  /** ISO instant the current occurrence ends, when live. */
  endsAt: string | null;
}

/**
 * Recurring gatherings (the daily online prayer meeting).
 *
 * Members read; PASTOR and ADMIN write. Tenant scoping is applied on every
 * query here, which is the enforcement layer — RLS on this table is a deny-all
 * backstop against direct database access, not a per-row policy.
 */
@Injectable()
export class GatheringsService {
  private readonly logger = new Logger(GatheringsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Active gatherings with their next occurrence, for the member dashboard. */
  async listActive(): Promise<GatheringView[]> {
    const rows = await this.prisma.recurringGathering.findMany({
      where: { tenantId: this.tenantId, isActive: true },
      orderBy: { startTime: 'asc' },
    });
    return rows.map((row) => this.toView(row));
  }

  /** Everything, including inactive. Admin view. */
  async listAll(): Promise<GatheringView[]> {
    const rows = await this.prisma.recurringGathering.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toView(row));
  }

  async create(actor: AuthUser, input: CreateGatheringInput): Promise<GatheringView> {
    const created = await this.prisma.recurringGathering.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        title: input.title,
        description: input.description ?? null,
        recurrenceRule: input.recurrenceRule,
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        startTime: input.startTime,
        durationMinutes: input.durationMinutes,
        timezone: input.timezone,
        joinUrl: input.joinUrl ?? null,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    });

    await this.audit('CREATE', created.id, actor.profileId, undefined, this.snapshot(created));
    return this.toView(created);
  }

  async update(actor: AuthUser, id: string, input: UpdateGatheringInput): Promise<GatheringView> {
    const before = await this.prisma.recurringGathering.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!before) throw new NotFoundException('Gathering not found');

    const updated = await this.prisma.recurringGathering.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.recurrenceRule !== undefined && { recurrenceRule: input.recurrenceRule }),
        ...(input.startDate !== undefined && {
          startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        }),
        ...(input.startTime !== undefined && { startTime: input.startTime }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.joinUrl !== undefined && { joinUrl: input.joinUrl }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      },
    });

    await this.audit('UPDATE', id, actor.profileId, this.snapshot(before), this.snapshot(updated));
    return this.toView(updated);
  }

  async remove(actor: AuthUser, id: string) {
    const before = await this.prisma.recurringGathering.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!before) throw new NotFoundException('Gathering not found');

    await this.prisma.recurringGathering.delete({ where: { id } });
    await this.audit('DELETE', id, actor.profileId, this.snapshot(before), undefined);
    return { id, deleted: true };
  }

  /**
   * Computes the next occurrence and whether one is running right now.
   *
   * Walks forward day by day rather than using an RRULE library: the supported
   * rules are DAILY and WEEKLY, the horizon is at most a week, and this keeps
   * the "is it live now" answer in the same place as the "when next" answer so
   * the two cannot disagree.
   *
   * The walk is over calendar dates in the gathering's own timezone, not UTC
   * dates. For an evening gathering in Lagos those differ for the last hour of
   * every UTC day, which would otherwise report tomorrow's occurrence as today's.
   */
  private toView(row: {
    id: string;
    title: string;
    description: string | null;
    recurrenceRule: string;
    startDate: Date;
    startTime: string;
    durationMinutes: number;
    timezone: string;
    joinUrl: string | null;
    isActive: boolean;
  }): GatheringView {
    const now = new Date();
    const durationMs = row.durationMinutes * 60_000;
    const today = localCalendarDate(now, row.timezone);

    let nextOccurrenceAt: Date | null = null;
    let isLive = false;
    let endsAt: Date | null = null;

    // Start one day back so an occurrence that began yesterday evening and runs
    // past midnight is still recognised as live. Seven days forward is enough to
    // reach the next occurrence of any weekly rule.
    for (let offset = -1; offset <= 7; offset += 1) {
      const date = addDays(today, offset);
      if (ruleOccursOn(row.recurrenceRule, row.startDate, date) !== 'yes') continue;

      const start = buildGatheringOccurrenceStart(date, row.startTime, row.timezone);
      const end = new Date(start.getTime() + durationMs);

      if (now >= start && now < end) {
        isLive = true;
        endsAt = end;
        nextOccurrenceAt = start;
        break;
      }
      if (start > now) {
        nextOccurrenceAt = start;
        break;
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      recurrenceRule: row.recurrenceRule,
      startDate: row.startDate.toISOString().slice(0, 10),
      startTime: row.startTime,
      durationMinutes: row.durationMinutes,
      timezone: row.timezone,
      joinUrl: row.joinUrl,
      isActive: row.isActive,
      nextOccurrenceAt: nextOccurrenceAt?.toISOString() ?? null,
      isLive,
      endsAt: endsAt?.toISOString() ?? null,
    };
  }

  private snapshot(row: Record<string, unknown>): Prisma.InputJsonValue {
    return {
      title: row.title,
      recurrenceRule: row.recurrenceRule,
      startTime: row.startTime,
      durationMinutes: row.durationMinutes,
      timezone: row.timezone,
      joinUrl: row.joinUrl,
      isActive: row.isActive,
    } as Prisma.InputJsonValue;
  }

  /** Mirrors the audit pattern used by headcount and CMS. Never breaks the mutation. */
  private async audit(
    action: string,
    entityId: string,
    actorId: string | null,
    before?: Prisma.InputJsonValue,
    after?: Prisma.InputJsonValue,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          actorId,
          action,
          entity: 'RecurringGathering',
          entityId,
          before: before ?? Prisma.DbNull,
          after: after ?? Prisma.DbNull,
        },
      });
    } catch (err) {
      this.logger.error(
        `Audit write failed (${action} RecurringGathering): ${(err as Error).message}`,
      );
    }
  }
}
