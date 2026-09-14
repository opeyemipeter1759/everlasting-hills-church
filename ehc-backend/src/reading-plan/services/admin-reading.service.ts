import { Injectable } from '@nestjs/common';
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
 * "gone quiet" rather than a ranking of who reads most.
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
          profileId: true,
          status: true,
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
    };
  }
}
