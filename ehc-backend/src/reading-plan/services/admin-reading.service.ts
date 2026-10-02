import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { addDays, fromDateColumn, localDate, toDateColumn } from '../local-date.util';

/** Read within this many days, today included, to count as reading now. */
export const READING_NOW_DAYS = 7;

/**
 * READING      read at least once in the last week
 * QUIET        has a plan in progress or paused, but no reading this week
 * FINISHED     every plan they started is complete, and nothing read this week
 * NOT_STARTED  has never started a plan
 */
export type ReaderState = 'READING' | 'QUIET' | 'FINISHED' | 'NOT_STARTED';

/**
 * Bible reading across the church, for pastors and admins.
 *
 * Read-only, one row per active member: which plans they are on, how far
 * along, when they last read, and how much in the last week and month. It is
 * here so leaders can encourage people, which is why the state that leads is
 * "gone quiet" rather than a ranking of who reads most. The one change it can
 * make is clearing gone quiet, which an admin confirms by number.
 *
 * The church's day is Lagos's, the same day the member screens count in.
 */
@Injectable()
export class AdminReadingService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async overview() {
    const { clearablePlanIds, clearableMembers, ...overview } = await this.build();
    return { ...overview, clearable: { plans: clearablePlanIds.length, members: clearableMembers } };
  }

  /**
   * Clears "gone quiet" in one step, for an admin who wants a clean slate.
   *
   * Removes the plans of members who have read nothing this week, where the
   * plan is in progress or paused and began before this week: a plan started
   * in the last seven days has been touched, so it stays. Removed, not
   * deleted: the same ABANDONED a member's own Remove sets, so their reading
   * history stays and they can choose a plan again. Members reading this week
   * and finished plans are never touched.
   *
   * The admin confirms the number they were shown. If the list has changed
   * since the page loaded, nothing is removed and they are asked to refresh.
   */
  async clearGoneQuiet(expectedPlans: number) {
    const { clearablePlanIds, clearableMembers } = await this.build();
    if (clearablePlanIds.length !== expectedPlans) {
      throw new ConflictException(
        'Gone quiet has changed since this page loaded. Refresh the page and try again.',
      );
    }
    if (clearablePlanIds.length === 0) return { removedPlans: 0, members: 0 };
    const result = await this.prisma.memberPlanSubscription.updateMany({
      where: {
        tenantId: this.tenantId,
        id: { in: clearablePlanIds },
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
      },
      data: { status: SubscriptionStatus.ABANDONED },
    });
    return { removedPlans: result.count, members: clearableMembers };
  }

  private async build() {
    const today = localDate('Africa/Lagos');
    const weekFrom = addDays(today, -(READING_NOW_DAYS - 1));
    const monthFrom = addDays(today, -29);

    const [members, subscriptions, week, month] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId: this.tenantId, status: MemberStatus.ACTIVE },
        select: { id: true, profileId: true, firstName: true, lastName: true, photoUrl: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.memberPlanSubscription.findMany({
        where: {
          tenantId: this.tenantId,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED, SubscriptionStatus.COMPLETED],
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          profileId: true,
          status: true,
          startedOn: true,
          completedDays: true,
          currentStreak: true,
          lastReadOn: true,
          Plan: { select: { title: true, durationDays: true } },
        },
      }),
      this.prisma.memberPlanProgress.groupBy({
        by: ['profileId'],
        where: { tenantId: this.tenantId, completedOn: { gte: toDateColumn(weekFrom) } },
        _count: { _all: true },
      }),
      this.prisma.memberPlanProgress.groupBy({
        by: ['profileId'],
        where: { tenantId: this.tenantId, completedOn: { gte: toDateColumn(monthFrom) } },
        _count: { _all: true },
      }),
    ]);

    const readingsThisWeek = new Map(week.map((row) => [row.profileId, row._count._all]));
    const readingsThisMonth = new Map(month.map((row) => [row.profileId, row._count._all]));
    const plansByProfile = new Map<string, typeof subscriptions>();
    for (const subscription of subscriptions) {
      const list = plansByProfile.get(subscription.profileId) ?? [];
      list.push(subscription);
      plansByProfile.set(subscription.profileId, list);
    }

    // Plans an admin may clear: in progress or paused, belonging to someone
    // who has gone quiet, and begun before this week.
    const clearablePlanIds: string[] = [];
    const clearableProfiles = new Set<string>();

    const readers = members.map((member) => {
      const plans = plansByProfile.get(member.profileId) ?? [];
      const readingsLast7 = readingsThisWeek.get(member.profileId) ?? 0;
      const inProgress = plans.filter((plan) => plan.status !== SubscriptionStatus.COMPLETED);
      const lastReadDates = plans
        .map((plan) => fromDateColumn(plan.lastReadOn))
        .filter((date): date is string => date !== null)
        .sort();

      const state: ReaderState =
        plans.length === 0
          ? 'NOT_STARTED'
          : readingsLast7 > 0
            ? 'READING'
            : inProgress.length > 0
              ? 'QUIET'
              : 'FINISHED';

      if (state === 'QUIET') {
        for (const plan of inProgress) {
          const started = fromDateColumn(plan.startedOn);
          if (started !== null && started < weekFrom) {
            clearablePlanIds.push(plan.id);
            clearableProfiles.add(member.profileId);
          }
        }
      }

      return {
        memberId: member.id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        photoUrl: member.photoUrl,
        state,
        lastReadOn: lastReadDates.length ? lastReadDates[lastReadDates.length - 1] : null,
        readingsLast7,
        readingsLast30: readingsThisMonth.get(member.profileId) ?? 0,
        currentStreak: Math.max(
          0,
          ...plans
            .filter((plan) => plan.status === SubscriptionStatus.ACTIVE)
            .map((plan) => plan.currentStreak),
        ),
        plans: plans.map((plan) => ({
          title: plan.Plan.title,
          status: plan.status,
          completedDays: plan.completedDays,
          durationDays: plan.Plan.durationDays,
        })),
      };
    });

    const inState = (state: ReaderState) => readers.filter((reader) => reader.state === state).length;
    return {
      today,
      stats: {
        activeMembers: readers.length,
        reading: inState('READING'),
        quiet: inState('QUIET'),
        finished: inState('FINISHED'),
        notStarted: inState('NOT_STARTED'),
        readingsThisWeek: readers.reduce((sum, reader) => sum + reader.readingsLast7, 0),
        plansCompleted: readers.reduce(
          (sum, reader) =>
            sum + reader.plans.filter((plan) => plan.status === SubscriptionStatus.COMPLETED).length,
          0,
        ),
      },
      readers,
      clearablePlanIds,
      clearableMembers: clearableProfiles.size,
    };
  }
}
