import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PlanStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import {
  addDays,
  fromDateColumn,
  isValidTimezone,
  localDate,
  toDateColumn,
} from '../local-date.util';
import { advanceStreak, paceDelta, type StreakState } from '../streak.util';
import { PlanProgressRepository } from './plan-progress.repository';

const summaryInclude = {
  Plan: {
    select: {
      id: true,
      slug: true,
      title: true,
      durationDays: true,
      coverImageUrl: true,
    },
  },
  Translation: { select: { id: true, code: true, name: true } },
} satisfies Prisma.MemberPlanSubscriptionInclude;

type SubscriptionSummarySource = Prisma.MemberPlanSubscriptionGetPayload<{
  include: typeof summaryInclude;
}>;

const subscriptionResult = {
  id: true,
  planId: true,
  currentDayIndex: true,
  timezone: true,
} as const;

/** Twelve weeks: enough to show a habit forming, narrow enough for a phone. */
export const ACTIVITY_DAYS = 84;

/**
 * A member's own reading plan: subscribing, reading today, marking a day done.
 *
 * Everything here is private and never cached. The dashboard response carries
 * references only, never scripture text, so the card is one small query and the
 * text loads on the reading screen.
 */
@Injectable()
export class MeReadingPlanService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: PlanProgressRepository,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private profileOrThrow(actor: AuthUser): string {
    if (!actor.profileId) {
      throw new ForbiddenException('No profile linked to this account');
    }
    return actor.profileId;
  }

  /**
   * Today's reading, or null when the member has not chosen a plan.
   *
   * Null is a normal answer, not an error: most members have not subscribed
   * yet, and the dashboard renders a chooser in that case.
   */
  async today(actor: AuthUser, subscriptionId?: string) {
    const profileId = this.profileOrThrow(actor);

    const subscription = await this.prisma.memberPlanSubscription.findFirst({
      where: {
        tenantId: this.tenantId,
        profileId,
        ...(subscriptionId
          ? {
              id: subscriptionId,
              status: {
                in: [
                  SubscriptionStatus.ACTIVE,
                  SubscriptionStatus.PAUSED,
                  SubscriptionStatus.COMPLETED,
                ],
              },
            }
          : { status: SubscriptionStatus.ACTIVE }),
      },
      orderBy: { createdAt: 'desc' },
      include: summaryInclude,
    });
    if (!subscription && subscriptionId)
      throw new NotFoundException('Subscription not found');
    if (!subscription) return null;

    const day = await this.prisma.readingPlanDay.findFirst({
      where: {
        planId: subscription.planId,
        dayIndex: subscription.currentDayIndex,
      },
      select: {
        dayIndex: true,
        title: true,
        referenceLabel: true,
        reflectionPrompt: true,
        estimatedMinutes: true,
        Portions: {
          orderBy: { sequence: 'asc' },
          select: {
            sequence: true,
            label: true,
            startVerseId: true,
            endVerseId: true,
            isOptional: true,
          },
        },
      },
    });

    return { ...this.summary(subscription), day };
  }

  /** All of the member's plans, including paused progress and completed history. */
  async subscriptions(actor: AuthUser) {
    const profileId = this.profileOrThrow(actor);
    const subscriptions = await this.prisma.memberPlanSubscription.findMany({
      where: {
        tenantId: this.tenantId,
        profileId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAUSED,
            SubscriptionStatus.COMPLETED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: summaryInclude,
    });
    return subscriptions.map((subscription) => this.summary(subscription));
  }

  private summary(subscription: SubscriptionSummarySource) {
    const startedOn = fromDateColumn(subscription.startedOn)!;
    const todayLocal = localDate(subscription.timezone);
    const daysSinceStarted =
      Math.round(
        (Date.parse(`${todayLocal}T00:00:00Z`) -
          Date.parse(`${startedOn}T00:00:00Z`)) /
          86_400_000,
      ) + 1;

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      startedOn,
      completedAt: subscription.completedAt?.toISOString() ?? null,
      plan: subscription.Plan,
      translation: subscription.Translation,
      timezone: subscription.timezone,
      currentDayIndex: subscription.currentDayIndex,
      completedDays: subscription.completedDays,
      currentStreak: subscription.currentStreak,
      longestStreak: subscription.longestStreak,
      lastReadOn: fromDateColumn(subscription.lastReadOn),
      reminderHour: subscription.reminderHour,
      // Encouragement only. Never rendered as "you are 7 days behind": the day
      // index model means there is no debt, only a pace.
      paceDelta: paceDelta(daysSinceStarted, subscription.completedDays),
      completedToday: fromDateColumn(subscription.lastReadOn) === todayLocal,
    };
  }

  /**
   * Reading effort across every plan, for the overview.
   *
   * Counted from the day log rather than the subscription counters, so the
   * calendar shows when somebody actually read, and a day read in two plans is
   * two readings on one date. Minutes come from each plan day's own estimate,
   * so they are "about", never "exactly".
   */
  async activity(actor: AuthUser) {
    const profileId = this.profileOrThrow(actor);
    // "Today" is the member's, from the timezone they last read in.
    const latest = await this.prisma.memberPlanSubscription.findFirst({
      where: { tenantId: this.tenantId, profileId },
      orderBy: { updatedAt: 'desc' },
      select: { timezone: true },
    });
    const timezone = latest?.timezone ?? 'Africa/Lagos';
    const today = localDate(timezone);
    const from = addDays(today, -(ACTIVITY_DAYS - 1));
    const last30 = addDays(today, -29);

    const [byDate, minutes] = await Promise.all([
      this.prisma.memberPlanProgress.groupBy({
        by: ['completedOn'],
        where: { tenantId: this.tenantId, profileId },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<{ minutes: number | null }[]>(Prisma.sql`
        SELECT SUM(d."estimatedMinutes")::int AS minutes
        FROM "MemberPlanProgress" p
        JOIN "MemberPlanSubscription" s ON s."id" = p."subscriptionId"
        JOIN "ReadingPlanDay" d ON d."planId" = s."planId" AND d."dayIndex" = p."dayIndex"
        WHERE p."tenantId" = ${this.tenantId} AND p."profileId" = ${profileId}
      `),
    ]);

    const counts = byDate
      .map((row) => ({
        date: fromDateColumn(row.completedOn)!,
        readings: row._count._all,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      timezone,
      from,
      today,
      days: counts.filter((day) => day.date >= from && day.date <= today),
      totals: {
        readings: counts.reduce((sum, day) => sum + day.readings, 0),
        activeDays: counts.length,
        activeDaysLast30: counts.filter((day) => day.date >= last30 && day.date <= today)
          .length,
        minutes: minutes[0]?.minutes ?? 0,
      },
    };
  }

  /** Serialize a member's progress writes, including concurrent starts/replays. */
  private async lockMember(tx: Prisma.TransactionClient, profileId: string) {
    await tx.$queryRaw(
      Prisma.sql`SELECT "id" FROM "Profile" WHERE "id" = ${profileId} FOR UPDATE`,
    );
  }

  /** Starts or resumes this plan while leaving every other plan untouched. */
  async subscribe(
    actor: AuthUser,
    input: {
      planId: string;
      translationCode?: string;
      timezone?: string;
      reminderHour?: number;
    },
  ) {
    const profileId = this.profileOrThrow(actor);

    const plan = await this.prisma.readingPlan.findFirst({
      where: {
        id: input.planId,
        status: PlanStatus.PUBLISHED,
        OR: [{ tenantId: null }, { tenantId: this.tenantId }],
      },
      select: { id: true, version: true, durationDays: true },
    });
    if (!plan) throw new NotFoundException('Reading plan not found');

    const timezone = input.timezone ?? 'Africa/Lagos';
    if (!isValidTimezone(timezone)) {
      throw new BadRequestException(
        `${timezone} is not a timezone this server recognises`,
      );
    }

    const translation = input.translationCode
      ? await this.prisma.bibleTranslation.findUnique({
          where: { code: input.translationCode.toUpperCase() },
        })
      : await this.prisma.bibleTranslation.findFirst({
          where: { isDefault: true },
        });
    if (!translation) throw new NotFoundException('Translation not found');

    const startedOn = localDate(timezone);

    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, profileId);
      const scope = {
        tenantId: this.tenantId,
        profileId,
        planId: plan.id,
        anchorDate: null,
      };
      const active = await tx.memberPlanSubscription.findFirst({
        where: { ...scope, status: SubscriptionStatus.ACTIVE },
        select: subscriptionResult,
      });
      if (active) return active;

      const paused = await tx.memberPlanSubscription.findFirst({
        where: { ...scope, status: SubscriptionStatus.PAUSED },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
      if (paused) {
        // Keep the original dates, translation, reminders, streak and day log.
        return tx.memberPlanSubscription.update({
          where: { id: paused.id },
          data: { status: SubscriptionStatus.ACTIVE },
          select: subscriptionResult,
        });
      }

      return tx.memberPlanSubscription.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          profileId,
          planId: plan.id,
          planVersion: plan.version,
          translationId: translation.id,
          status: SubscriptionStatus.ACTIVE,
          startedOn: toDateColumn(startedOn),
          timezone,
          currentDayIndex: 1,
          reminderHour: input.reminderHour ?? null,
        },
        select: subscriptionResult,
      });
    });
  }

  private async ownedSubscription(
    actor: AuthUser,
    subscriptionId: string,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const profileId = this.profileOrThrow(actor);
    const subscription = await client.memberPlanSubscription.findFirst({
      where: { id: subscriptionId, tenantId: this.tenantId, profileId },
      include: { Plan: { select: { durationDays: true } } },
    });
    // Not found and not yours are the same answer on purpose: a member must not
    // be able to probe for other people's subscription ids.
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async update(
    actor: AuthUser,
    subscriptionId: string,
    input: {
      status?: 'ACTIVE' | 'PAUSED';
      translationCode?: string;
      reminderHour?: number | null;
      timezone?: string;
    },
  ) {
    const subscription = await this.ownedSubscription(actor, subscriptionId);
    const data: Record<string, unknown> = {};

    if (input.status) data.status = input.status as SubscriptionStatus;
    if (input.reminderHour !== undefined)
      data.reminderHour = input.reminderHour;

    if (input.timezone) {
      if (!isValidTimezone(input.timezone)) {
        throw new BadRequestException(
          `${input.timezone} is not a timezone this server recognises`,
        );
      }
      data.timezone = input.timezone;
    }

    if (input.translationCode) {
      const translation = await this.prisma.bibleTranslation.findUnique({
        where: { code: input.translationCode.toUpperCase() },
      });
      if (!translation) throw new NotFoundException('Translation not found');
      data.translationId = translation.id;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, subscription.profileId);
      const current = await this.ownedSubscription(actor, subscriptionId, tx);
      if (input.status && current.status === SubscriptionStatus.COMPLETED) {
        throw new BadRequestException(
          'This plan is complete. Start it again to keep your completed history.',
        );
      }
      if (input.status === 'ACTIVE' && current.anchorDate === null) {
        const active = await tx.memberPlanSubscription.findFirst({
          where: {
            tenantId: this.tenantId,
            profileId: current.profileId,
            planId: current.planId,
            status: SubscriptionStatus.ACTIVE,
            anchorDate: null,
            id: { not: current.id },
          },
          select: { id: true },
        });
        if (active)
          throw new ConflictException(
            'You are already reading this plan. Continue its active reading.',
          );
      }
      return tx.memberPlanSubscription.update({
        where: { id: subscription.id },
        data,
        select: {
          id: true,
          status: true,
          translationId: true,
          reminderHour: true,
          timezone: true,
          currentDayIndex: true,
        },
      });
    });
  }

  /**
   * Marks a day complete.
   *
   * Addressed by the day it affects rather than an implied cursor, which makes
   * it idempotent by construction: the same request five times leaves
   * completedDays at one. A "complete next" endpoint could not promise that,
   * and it breaks the moment a request is retried, a member double taps, or an
   * offline queue replays.
   */
  async completeDay(actor: AuthUser, subscriptionId: string, dayIndex: number) {
    const profileId = this.profileOrThrow(actor);
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, profileId);
      const subscription = await this.ownedSubscription(
        actor,
        subscriptionId,
        tx,
      );
      if (subscription.status === SubscriptionStatus.PAUSED) {
        throw new BadRequestException(
          'Resume this plan before marking another day as read.',
        );
      }
      if (subscription.status === SubscriptionStatus.ABANDONED) {
        throw new BadRequestException('This reading plan has been abandoned.');
      }
      const duration = subscription.Plan.durationDays;
      if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > duration) {
        throw new BadRequestException(
          `This plan runs from day 1 to day ${duration}`,
        );
      }
      const today = localDate(subscription.timezone);
      const portions = await tx.readingPlanPortion.count({
        where: { Day: { planId: subscription.planId, dayIndex } },
      });
      const inserted = await this.progress.markComplete({
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        profileId: subscription.profileId,
        dayIndex,
        completedOn: today,
        portionsDone: portions,
        tx,
      });

      // Already recorded. Return the state unchanged rather than advancing a
      // streak twice for one day's reading.
      if (!inserted) {
        return {
          id: subscription.id,
          currentDayIndex: subscription.currentDayIndex,
          completedDays: subscription.completedDays,
          currentStreak: subscription.currentStreak,
          longestStreak: subscription.longestStreak,
          status: subscription.status,
          alreadyComplete: true,
        };
      }

      const dayIndexes = await this.progress.completedDayIndexes(
        subscription.id,
        tx,
      );
      const completedDays = dayIndexes.length;
      const streak = advanceStreak(
        {
          currentStreak: subscription.currentStreak,
          longestStreak: subscription.longestStreak,
          lastReadOn: fromDateColumn(subscription.lastReadOn),
          graceUsedOn: fromDateColumn(subscription.graceUsedOn),
        } satisfies StreakState,
        today,
      );

      const finished = completedDays >= duration;

      const updated = await tx.memberPlanSubscription.update({
        where: { id: subscription.id },
        data: {
          completedDays,
          currentDayIndex: this.firstUnreadDay(dayIndexes, duration),
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastReadOn: toDateColumn(streak.lastReadOn!),
          graceUsedOn: streak.graceUsedOn
            ? toDateColumn(streak.graceUsedOn)
            : null,
          ...(finished
            ? { status: SubscriptionStatus.COMPLETED, completedAt: new Date() }
            : {}),
        },
        select: {
          id: true,
          currentDayIndex: true,
          completedDays: true,
          currentStreak: true,
          longestStreak: true,
          status: true,
        },
      });
      return { ...updated, alreadyComplete: false };
    });
  }

  private firstUnreadDay(dayIndexes: number[], duration: number): number {
    const completed = new Set(dayIndexes);
    for (let day = 1; day <= duration; day += 1) {
      if (!completed.has(day)) return day;
    }
    return duration;
  }

  /**
   * Undoes a completion, for a mis-tap.
   *
   * The streak is deliberately left where it is. Recomputing it would mean
   * replaying every completion date in order, and the failure mode of getting
   * that wrong is telling somebody their sixty day streak never happened.
   */
  async uncompleteDay(
    actor: AuthUser,
    subscriptionId: string,
    dayIndex: number,
  ) {
    const profileId = this.profileOrThrow(actor);
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, profileId);
      const subscription = await this.ownedSubscription(
        actor,
        subscriptionId,
        tx,
      );
      if (
        !Number.isInteger(dayIndex) ||
        dayIndex < 1 ||
        dayIndex > subscription.Plan.durationDays
      ) {
        throw new BadRequestException(
          `This plan runs from day 1 to day ${subscription.Plan.durationDays}`,
        );
      }
      const removed = await this.progress.clearComplete({
        subscriptionId: subscription.id,
        dayIndex,
        tx,
      });
      if (!removed) {
        return {
          id: subscription.id,
          currentDayIndex: subscription.currentDayIndex,
          completedDays: subscription.completedDays,
          removed: false,
        };
      }

      const dayIndexes = await this.progress.completedDayIndexes(
        subscription.id,
        tx,
      );
      const completedDays = dayIndexes.length;
      const otherActive =
        subscription.status === SubscriptionStatus.COMPLETED &&
        subscription.anchorDate === null
          ? await tx.memberPlanSubscription.findFirst({
              where: {
                tenantId: this.tenantId,
                profileId,
                planId: subscription.planId,
                status: SubscriptionStatus.ACTIVE,
                anchorDate: null,
                id: { not: subscription.id },
              },
              select: { id: true },
            })
          : null;
      const updated = await tx.memberPlanSubscription.update({
        where: { id: subscription.id },
        data: {
          completedDays,
          currentDayIndex: this.firstUnreadDay(
            dayIndexes,
            subscription.Plan.durationDays,
          ),
          // Preserve a newer reading of the same plan if this is older history.
          ...(subscription.status === SubscriptionStatus.COMPLETED
            ? {
                status: otherActive
                  ? SubscriptionStatus.PAUSED
                  : SubscriptionStatus.ACTIVE,
                completedAt: null,
              }
            : {}),
        },
        select: { id: true, currentDayIndex: true, completedDays: true },
      });
      return { ...updated, removed: true };
    });
  }

  /** Day indexes already read, for ticking off a day list. */
  async completedDays(actor: AuthUser, subscriptionId: string) {
    const subscription = await this.ownedSubscription(actor, subscriptionId);
    return {
      dayIndexes: await this.progress.completedDayIndexes(subscription.id),
    };
  }
}
