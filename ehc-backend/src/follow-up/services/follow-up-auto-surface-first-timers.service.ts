import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { FollowUpSourceType, FollowUpStage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../../outbox/outbox.service';
import type { Env } from '../../config/env.validation';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAutoAssignService } from './follow-up-auto-assign.service';
import { VisitorEvents, type VisitorCreatedPayload } from '../../notifications/notification-events';
import { routeFor } from '../routing/routing';
import { proposeAssignment, ROUTING_REQUESTER } from '../approvals/assignment-approval';
import { FollowUpEvent, safeFirstName, type RegisteredPayload } from '../events/follow-up-events';
import { WORKFLOW_TX } from '../workflow-tx';

/** How often the pipeline's own on-load backfill is allowed to run. */
const SURFACE_MISSING_THROTTLE_MS = 15_000;

const CANDIDATE = { id: true, firstName: true, gender: true, isStudent: true } as const;

interface VisitorCandidate {
  id: string;
  firstName: string;
  gender: string | null;
  isStudent: boolean | null;
}

@Injectable()
export class FollowUpAutoSurfaceFirstTimersService {
  private readonly logger = new Logger(FollowUpAutoSurfaceFirstTimersService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    private readonly autoAssign: FollowUpAutoAssignService,
    private readonly outbox: OutboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private lastSurfaceMissingAt = 0;

  /**
   * A first-timer was just recorded (form, import): route them under the rules
   * and tell the first-timer contact, in one transaction with the entry, then
   * dispatch. A failure here is logged, never surfaced to the form that created
   * the visitor; the outbox sweeper retries any event left behind.
   */
  @OnEvent(VisitorEvents.Created, { async: true, promisify: true })
  async onVisitorCreated(payload: VisitorCreatedPayload): Promise<void> {
    try {
      const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
      const visitors = await this.prisma.visitor.findMany({
        where: { tenantId: this.tenantId, id: { in: payload.visitorIds }, convertedAt: null, archivedAt: null },
        select: CANDIDATE,
      });
      const created = await this.placeAll(visitors, new Map(), followUpUnitId, true);
      if (created > 0) this.logger.log(`Surfaced ${created} new first-timer(s) into the Follow-Up pipeline`);
    } catch (err) {
      this.logger.warn(`Could not surface new first-timer(s): ${(err as Error).message}`);
    }
  }

  /**
   * Safety net for the pipeline itself: any unconverted visitor that has never
   * had an entry (event missed, feature just turned on, entry deleted by hand)
   * gets one the next time someone opens the pipeline. Throttled so the list
   * endpoint's polling doesn't turn this into a hot loop.
   */
  async surfaceMissing(): Promise<number> {
    const now = Date.now();
    if (now - this.lastSurfaceMissingAt < SURFACE_MISSING_THROTTLE_MS) return 0;
    this.lastSurfaceMissingAt = now;

    const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, archivedAt: null, FollowUpEntry: { none: {} } },
      select: CANDIDATE,
    });
    return this.placeAll(visitors, new Map(), followUpUnitId, false);
  }

  async run(leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, archivedAt: null },
      select: CANDIDATE,
    });
    return this.placeAll(visitors, leaderCache, followUpUnitId, false);
  }

  /** On-demand backfill for one past service's still-unconverted first-timers. */
  async backfillForService(serviceId: string, leaderCache: Map<string, string | null>, followUpUnitId: string | null): Promise<number> {
    if (!followUpUnitId) return 0;
    const visitors = await this.prisma.visitor.findMany({
      where: { tenantId: this.tenantId, convertedAt: null, archivedAt: null, serviceId },
      select: CANDIDATE,
    });
    return this.placeAll(visitors, leaderCache, followUpUnitId, false);
  }

  /**
   * Gives each visitor without an entry one. `registered` is true only for a
   * brand-new registration: then the first-timer contact hears about them even
   * when no entry can be made. Sweeps never re-announce old forms.
   */
  private async placeAll(
    visitors: VisitorCandidate[],
    leaderCache: Map<string, string | null>,
    followUpUnitId: string | null,
    registered: boolean,
  ): Promise<number> {
    if (visitors.length === 0) return 0;
    // One entry per PERSON, not per team: a visitor a leader already added by
    // hand, in whatever unit, must not get a second entry here.
    const existing = await this.prisma.followUpEntry.findMany({
      where: { tenantId: this.tenantId, visitorId: { in: visitors.map((v) => v.id) } },
      select: { visitorId: true },
    });
    const existingIds = new Set(existing.map((e) => e.visitorId));

    let created = 0;
    for (const visitor of visitors) {
      const hasEntry = existingIds.has(visitor.id);
      if (hasEntry && !registered) continue;
      if (await this.placeOne(visitor, leaderCache, followUpUnitId, { createEntry: !hasEntry, registered })) created += 1;
      existingIds.add(visitor.id);
    }
    return created;
  }

  /** One visitor, in one transaction: the entry, its assignment and the events. True when an entry was made. */
  private async placeOne(
    visitor: VisitorCandidate,
    leaderCache: Map<string, string | null>,
    followUpUnitId: string | null,
    opts: { createEntry: boolean; registered: boolean },
  ): Promise<boolean> {
    const eventIds: string[] = [];
    let made = false;
    try {
      await this.prisma.$transaction(async (tx) => {
        if (opts.createEntry) made = await this.createEntry(tx, visitor, leaderCache, followUpUnitId, eventIds);
        if (opts.registered) {
          const payload: RegisteredPayload = { visitorId: visitor.id, firstName: safeFirstName(visitor.firstName) };
          eventIds.push(await this.outbox.record(tx, { tenantId: this.tenantId, type: FollowUpEvent.Registered, payload: { ...payload } }));
        }
      }, WORKFLOW_TX);
    } catch (err) {
      // Another process (an overlapping sweep) made this person's entry first;
      // the unique constraint on visitorId is the real guard. The contact still
      // hears about a new registration.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        if (opts.createEntry && opts.registered) await this.placeOne(visitor, leaderCache, followUpUnitId, { createEntry: false, registered: true });
        return false;
      }
      throw err;
    }
    await this.outbox.dispatchNow(eventIds);
    return made;
  }

  /**
   * A routing rule decides first: its unit, and the least-loaded person in its
   * pool. With no rule (or nobody free in its pool) it is the Follow-Up unit and
   * its own auto-assign. Either way the person picked is only proposed: the
   * unit's team leads approve who a new first-timer goes to.
   */
  private async createEntry(
    tx: Prisma.TransactionClient,
    visitor: VisitorCandidate,
    leaderCache: Map<string, string | null>,
    followUpUnitId: string | null,
    eventIds: string[],
  ): Promise<boolean> {
    const route = await routeFor(tx, this.tenantId, { isStudent: visitor.isStudent });
    const unitId = route?.unitId ?? followUpUnitId;
    if (!unitId) return false;

    const addedById =
      (await this.unitLeaderLookup.getUnitLeaderProfileId(unitId, leaderCache)) ??
      (followUpUnitId && followUpUnitId !== unitId ? await this.unitLeaderLookup.getUnitLeaderProfileId(followUpUnitId, leaderCache) : null);
    if (!addedById) {
      this.logger.warn(`auto-surface: unit ${unitId} has no active leader, skipping first-timer auto-create`);
      return false;
    }

    const assigneeId = route?.assigneeId ?? (await this.autoAssign.pickAssignee(unitId, visitor.gender));
    await tx.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        unitId,
        sourceType: FollowUpSourceType.FIRST_TIMER,
        visitorId: visitor.id,
        addedById,
        stage: FollowUpStage.UNASSIGNED,
      },
      select: { id: true },
    });
    if (assigneeId) {
      const eventId = await proposeAssignment(tx, this.outbox, {
        tenantId: this.tenantId,
        visitorId: visitor.id,
        firstName: visitor.firstName,
        unitId,
        assigneeId,
        routingRuleId: route?.ruleId ?? null,
        requesterId: ROUTING_REQUESTER,
      });
      if (eventId) eventIds.push(eventId);
    }
    return true;
  }
}
