import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { PipelineRepository } from '../../pipeline/pipeline.repository';
import type { OverrideStatus, PipelineRow } from '../../pipeline/pipeline.types';
import { dateColumn, dayOf, lagosDay, parseVisitDay, prettyDay } from './visit-day.util';

/** A visit as it is recorded: FORM, CAME_AGAIN, RETURN_FORM, BACKFILL or BACKFILL_STATUS. */
export interface RecordedVisit {
  date: string;
  source: string;
}

/**
 * The visits behind Second and Third timer. A visit is a church-local date,
 * one row per person per date, so recording the same day twice changes
 * nothing. Counting stays in the pipeline repository; this only writes rows.
 */
@Injectable()
export class FirstTimerVisitsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: PipelineRepository,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** The person as the pipeline reads them; tenant-scoped and never an archived form. */
  async person(visitorId: string): Promise<PipelineRow> {
    const row = await this.pipeline.one(visitorId);
    if (!row) throw new NotFoundException('First-timer not found');
    return row;
  }

  /** The church-local day of the latest service already held: what "Came again" defaults to. */
  async latestServiceDay(now = new Date()): Promise<string> {
    const service = await this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { lte: now }, cancelledAt: null },
      orderBy: { scheduledAt: 'desc' },
      select: { scheduledAt: true },
    });
    return lagosDay(service?.scheduledAt ?? now);
  }

  /** Their visits, how each was recorded, and the day "Came again" would use. */
  async list(visitorId: string) {
    const person = await this.person(visitorId);
    const rows = await this.prisma.firstTimerVisit.findMany({
      where: { tenantId: this.tenantId, visitorId },
      orderBy: { visitedOn: 'asc' },
      select: { visitedOn: true, source: true },
    });
    return {
      firstVisitDate: person.firstVisitDate,
      visitDates: person.visitDates,
      recorded: rows.map((r): RecordedVisit => ({ date: dayOf(r.visitedOn), source: r.source })),
      latestServiceDate: await this.latestServiceDay(),
    };
  }

  /** "Came again". The same day twice is one visit, so a double tap is harmless. */
  async cameAgain(actor: AuthUser, visitorId: string, rawDay?: string): Promise<{ added: boolean; date: string; person: PipelineRow }> {
    const before = await this.person(visitorId);
    const day = rawDay ? parseVisitDay(rawDay) : await this.latestServiceDay();
    if (day < before.firstVisitDate) {
      throw new BadRequestException(`A return visit can't be before their first visit on ${prettyDay(before.firstVisitDate)}`);
    }
    const { count } = await this.prisma.firstTimerVisit.createMany({
      data: [{ id: randomUUID(), tenantId: this.tenantId, visitorId, visitedOn: dateColumn(day), source: 'CAME_AGAIN', recordedById: actor.profileId }],
      skipDuplicates: true,
    });
    if (count) await this.audit(actor, 'CREATE', 'FirstTimerVisit', visitorId, undefined, { date: day, source: 'CAME_AGAIN' });
    return { added: count === 1, date: day, person: await this.person(visitorId) };
  }

  /** Undo a "Came again". The first visit, and visits from other sources, stay. */
  async undo(actor: AuthUser, visitorId: string, rawDay: string): Promise<PipelineRow> {
    const person = await this.person(visitorId);
    const day = parseVisitDay(rawDay);
    if (day === person.firstVisitDate) throw new BadRequestException("The first visit can't be removed. Correct its date instead.");
    const row = await this.prisma.firstTimerVisit.findFirst({
      where: { tenantId: this.tenantId, visitorId, visitedOn: dateColumn(day) },
      select: { id: true, source: true },
    });
    if (!row) throw new NotFoundException(`No visit was recorded with Came again on ${prettyDay(day)}`);
    if (row.source !== 'CAME_AGAIN') throw new BadRequestException('Only a visit added with Came again can be undone');
    await this.prisma.firstTimerVisit.deleteMany({ where: { id: row.id, source: 'CAME_AGAIN' } });
    await this.audit(actor, 'DELETE', 'FirstTimerVisit', visitorId, { date: day, source: 'CAME_AGAIN' });
    return this.person(visitorId);
  }

  /**
   * Correct the first visit date, e.g. a paper card typed in days later. It
   * moves the month they count in, so it must stay before their other visits.
   */
  async correctFirstVisit(actor: AuthUser, visitorId: string, rawDay: string): Promise<PipelineRow> {
    const person = await this.person(visitorId);
    const day = parseVisitDay(rawDay);
    if (day === person.firstVisitDate) return person;
    const next = person.visitDates.find((d) => d !== person.firstVisitDate);
    if (next && day >= next) {
      throw new BadRequestException(`The first visit must come before their next one on ${prettyDay(next)}. Undo that visit first if it is wrong.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.visitor.update({ where: { id: visitorId }, data: { firstVisitDate: dateColumn(day) } });
      const moved = await tx.firstTimerVisit.updateMany({
        where: { tenantId: this.tenantId, visitorId, source: 'FORM' },
        data: { visitedOn: dateColumn(day) },
      });
      if (moved.count === 0) {
        await tx.firstTimerVisit.createMany({
          data: [{ id: randomUUID(), tenantId: this.tenantId, visitorId, visitedOn: dateColumn(day), source: 'FORM', recordedById: actor.profileId }],
          skipDuplicates: true,
        });
      }
      await this.audit(actor, 'UPDATE', 'Visitor', visitorId, { firstVisitDate: person.firstVisitDate }, { firstVisitDate: day }, tx);
    }, { timeout: 15_000 }); // a cold pooler connection can take longer than the 5 s default
    return this.person(visitorId);
  }

  /**
   * Put them at a status by hand, which wins over their visits, or null to
   * follow their visits again. Integrated and opted out have their own flows
   * (the team leads' approval, Opt out and Restore), so neither is set here.
   * Someone integrated can only be marked Away, or back to Integrated (null),
   * and only by the Integration Team (`integrationTeam`).
   */
  async setStatus(
    actor: AuthUser,
    visitorId: string,
    status: OverrideStatus | null,
    integrationTeam: () => Promise<boolean> = async () => false,
  ): Promise<PipelineRow> {
    const before = await this.person(visitorId);
    if (before.status === 'OPTED_OUT') throw new BadRequestException('They have opted out. Restore them from their profile first.');
    if (before.stage === 'CONFIRMED') {
      if (status !== 'AWAY' && status !== null) throw new BadRequestException('They are integrated: they can only be marked Away, or back to Integrated');
      if (!(await integrationTeam())) throw new ForbiddenException('Only the Integration Team can mark an integrated member Away');
    }
    await this.prisma.visitor.update({
      where: { id: visitorId },
      data: { statusOverride: status, statusOverrideAt: status ? new Date() : null, statusOverrideById: status ? (actor.profileId ?? null) : null },
    });
    await this.audit(actor, 'UPDATE', 'Visitor', visitorId, { status: before.status, statusOverride: before.statusOverride }, { statusOverride: status });
    return this.person(visitorId);
  }

  private async audit(
    actor: AuthUser,
    action: string,
    entity: string,
    entityId: string,
    before?: Prisma.InputJsonValue,
    after?: Prisma.InputJsonValue,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        actorId: actor.userId,
        action,
        entity,
        entityId,
        before: before ?? Prisma.DbNull,
        after: after ?? Prisma.DbNull,
      },
    });
  }
}
