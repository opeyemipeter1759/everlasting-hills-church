import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { HeadcountStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { UpsertHeadcountSchema, type UpsertHeadcountInput } from '../dto/headcount.schema';
import { toDto, type HeadcountRow } from '../headcount.util';
import { HeadcountClockService } from './headcount-clock.service';
import { HeadcountDateService } from './headcount-date.service';
import { HeadcountReadService } from './headcount-read.service';
import { HeadcountAuditService } from './headcount-audit.service';

@Injectable()
export class HeadcountWriteService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: HeadcountClockService,
    private readonly dateSvc: HeadcountDateService,
    private readonly read: HeadcountReadService,
    private readonly audit: HeadcountAuditService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Create or update the authoritative headcount for a service, addressed by its
   * id. Recording is blocked until the service is LIVE or ENDED.
   */
  async upsert(serviceId: string, rawBody: unknown, actor: { id?: string | null }) {
    const svc = await this.read.serviceOrThrow(serviceId);
    if (this.clock.serviceState(svc) === 'SCHEDULED') {
      throw new BadRequestException('This service has not started yet. A headcount can only be recorded once the service is live.');
    }
    return this.persist(serviceId, rawBody, actor);
  }

  /**
   * Date-driven entry: the head usher picks a date, we find (or create) the
   * service for that day, then record the headcount against it. Only dates that
   * have already occurred (today or earlier, WAT) can be recorded.
   */
  async upsertByDate(dateStr: string, rawBody: unknown, actor: { id?: string | null }) {
    if (!this.dateSvc.canRecordDate(dateStr)) {
      throw new BadRequestException('You can only record a headcount for a date that has already occurred.');
    }
    const svc = (await this.dateSvc.findServiceForDate(dateStr)) ?? (await this.dateSvc.createServiceForDate(dateStr));
    return this.persist(svc.id, rawBody, actor);
  }

  /**
   * Shared write core. total is computed here (never trusted from the client);
   * firstTimers must not exceed it. Every write is audited. Callers gate on the
   * service/date state before calling this.
   */
  private async persist(serviceId: string, rawBody: unknown, actor: { id?: string | null }) {
    const parsed = UpsertHeadcountSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid headcount',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const body: UpsertHeadcountInput = parsed.data;

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

    await this.audit.write({
      action,
      entityId: row.id,
      actorId: actor.id ?? null,
      before: existing ? this.audit.snapshot(existing) : undefined,
      after: this.audit.snapshot(row),
    });

    return toDto(row);
  }
}
