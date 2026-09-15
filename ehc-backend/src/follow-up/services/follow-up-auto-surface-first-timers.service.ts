import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from './follow-up-auto-assign.service';
import { FollowUpNotifyService } from './follow-up-notify.service';
import { VisitorEvents, type VisitorCreatedPayload } from '../../notifications/notification-events';

/** How often the pipeline's own on-load backfill is allowed to run. */
const SURFACE_MISSING_THROTTLE_MS = 15_000;

interface VisitorCandidate {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
}

@Injectable()
export class FollowUpAutoSurfaceFirstTimersService {
  private readonly logger = new Logger(FollowUpAutoSurfaceFirstTimersService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    private readonly autoAssign: FollowUpAutoAssignService,
    private readonly notify: FollowUpNotifyService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private lastSurfaceMissingAt = 0;

  /**
   * A first-timer was just recorded somewhere (form, import, quick capture):
   * put them in the pipeline immediately rather than waiting for the daily
   * sweep. Out-of-band — a failure here is logged, never surfaced to the
   * form that created the visitor.
   */
  @OnEvent(VisitorEvents.Created, { async: true, promisify: true })
  async onVisitorCreated(payload: VisitorCreatedPayload): Promise<void> {
    try {
      const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
      if (!followUpUnitId) return;
      const visitors = await this.prisma.visitor.findMany({
        where: { tenantId: this.tenantId, id: { in: payload.visitorIds }, convertedAt: null },
        select: { id: true, firstName: true, lastName: true, gender: true },
      });
      const created = await this.createEntries(visitors, new Map(), followUpUnitId);
      if (created > 0) this.logger.log(`Surfaced ${created} new first-timer(s) into the Follow-Up pipeline`);
    } catch (err) {
      this.logger.warn(`Could not surface new first-timer(s): ${(err as Error).message}`);
    }
  }

  /**
   * Safety net for the pipeline itself: any unconverted visitor that has never
   * had an entry (event missed, feature just turned on, entry deleted by hand)
   * gets one the next time someone opens the pipeline. Throttled so the list
   * endpoint's polling doesn't turn this into a hot loop; the query is cheap
   * when there's nothing to do.
   */
  async surfaceMissing(): Promise<number> {
    const now = Date.now();
    if (now - this.lastSurfaceMissingAt < SURFACE_MISSING_THROTTLE_MS) return 0;
    this.lastSurfaceMissingAt = now;

    const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, FollowUpEntry: { none: {} } },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });
    if (visitors.length === 0) return 0;
    return this.createEntries(visitors, new Map(), followUpUnitId);
  }

  async run(leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });
    return this.createEntries(visitors, leaderCache, followUpUnitId);
  }

  /** On-demand backfill for one specific past service's still-unconverted
   * first-timers — covers the case where the daily sweep hadn't run yet (or
   * this church just turned the feature on) by the time someone looks for that
   * service day in the Follow-Up filter. */
  async backfillForService(serviceId: string, leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, serviceId },
      select: { id: true, firstName: true, lastName: true, gender: true },
    });
    return this.createEntries(visitors, leaderCache, followUpUnitId);
  }

  private async createEntries(
    visitors: VisitorCandidate[],
    leaderCache: Map<string, string | null>,
    followUpUnitId: string,
  ): Promise<number> {
    if (visitors.length === 0) return 0;

    const leaderProfileId = await this.unitLeaderLookup.getUnitLeaderProfileId(followUpUnitId, leaderCache);
    if (!leaderProfileId) {
      this.logger.warn('auto-surface: "Follow-Up" unit has no active leader, skipping first-timer auto-create');
      return 0;
    }

    // Not scoped to unitId or sourceType — one entry per PERSON is the
    // invariant, not one per team. A visitor a "First Timer Team" leader
    // already added manually must not also get a second entry from this daily
    // sweep just because that manual one lives in a different unit.
    const existing = await this.prisma.followUpEntry.findMany({
      where: {
        tenantId: this.tenantId,
        visitorId: { in: visitors.map((v) => v.id) },
      },
      select: { visitorId: true },
    });
    const existingIds = new Set(existing.map((e) => e.visitorId));

    let created = 0;
    for (const visitor of visitors) {
      if (existingIds.has(visitor.id)) continue;
      const assigneeId = await this.autoAssign.pickAssignee(followUpUnitId, visitor.gender);
      let entry;
      try {
        entry = await this.prisma.followUpEntry.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            unitId: followUpUnitId,
            sourceType: FollowUpSourceType.FIRST_TIMER,
            visitorId: visitor.id,
            addedById: leaderProfileId,
            assigneeId,
            stage: assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED,
          },
        });
      } catch (err) {
        // Another process (e.g. an overlapping run of this same sweep) won the
        // race and inserted this (unit, visitor) pair first — the DB's unique
        // constraint is the real guard here, this check is just the fast path.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          existingIds.add(visitor.id);
          continue;
        }
        throw err;
      }
      if (assigneeId) {
        await this.notify.notifyAssigned(assigneeId, `${visitor.firstName} ${visitor.lastName}`.trim(), entry.id);
      }
      existingIds.add(visitor.id);
      created += 1;
    }
    return created;
  }
}
