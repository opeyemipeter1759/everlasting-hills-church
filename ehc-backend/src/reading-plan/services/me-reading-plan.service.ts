import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PlanStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { fromDateColumn, isValidTimezone, localDate, toDateColumn } from '../local-date.util';
import { advanceStreak, paceDelta, type StreakState } from '../streak.util';
import { PlanProgressRepository } from './plan-progress.repository';

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
   * One query for the subscription and its current day. Null is a normal
   * answer, not an error: most members have not subscribed yet, and the
   * dashboard renders a chooser in that case.
   */
  async today(actor: AuthUser) {
    const profileId = this.profileOrThrow(actor);

    const subscription = await this.prisma.memberPlanSubscription.findFirst({
      where: { profileId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: {
        Plan: { select: { id: true, slug: true, title: true, durationDays: true, coverImageUrl: true } },
        Translation: { select: { id: true, code: true, name: true } },
      },
    });
    if (!subscription) return null;

    const day = await this.prisma.readingPlanDay.findFirst({
      where: { planId: subscription.planId, dayIndex: subscription.currentDayIndex },
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

    const startedOn = fromDateColumn(subscription.startedOn)!;
    const todayLocal = localDate(subscription.timezone);
    const daysSinceStarted =
      Math.round(
        (Date.parse(`${todayLocal}T00:00:00Z`) - Date.parse(`${startedOn}T00:00:00Z`)) / 86_400_000,
      ) + 1;

    return {
      subscriptionId: subscription.id,
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
      day,
    };
  }

  /** Subscribes to a plan, replacing any active subscription. */
  async subscribe(
    actor: AuthUser,
    input: { planId: string; translationCode?: string; timezone?: string; reminderHour?: number },
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
      throw new BadRequestException(`${timezone} is not a timezone this server recognises`);
    }

    const translation = input.translationCode
      ? await this.prisma.bibleTranslation.findUnique({
          where: { code: input.translationCode.toUpperCase() },
        })
      : await this.prisma.bibleTranslation.findFirst({ where: { isDefault: true } });
    if (!translation) throw new NotFoundException('Translation not found');

    const startedOn = localDate(timezone);

    return this.prisma.$transaction(async (tx) => {
      // One active plan at a time. An earlier plan is paused rather than
      // deleted, so its progress and streak survive a change of mind.
      await tx.memberPlanSubscription.updateMany({
        where: { profileId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.PAUSED },
      });

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
        select: { id: true, planId: true, currentDayIndex: true, timezone: true },
      });
    });
  }

  private async ownedSubscription(actor: AuthUser, subscriptionId: string) {
    const profileId = this.profileOrThrow(actor);
    const subscription = await this.prisma.memberPlanSubscription.findFirst({
      where: { id: subscriptionId, profileId },
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
    if (input.reminderHour !== undefined) data.reminderHour = input.reminderHour;

    if (input.timezone) {
      if (!isValidTimezone(input.timezone)) {
        throw new BadRequestException(`${input.timezone} is not a timezone this server recognises`);
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

    return this.prisma.memberPlanSubscription.update({
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
    const subscription = await this.ownedSubscription(actor, subscriptionId);
    const duration = subscription.Plan.durationDays;

    if (dayIndex < 1 || dayIndex > duration) {
      throw new BadRequestException(`This plan runs from day 1 to day ${duration}`);
    }

    const today = localDate(subscription.timezone);
    const portions = await this.prisma.readingPlanPortion.count({
      where: { Day: { planId: subscription.planId, dayIndex } },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
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
      if (!inserted) return null;

      const completedDays = await this.progress.countCompleted(subscription.id, tx);
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

      return tx.memberPlanSubscription.update({
        where: { id: subscription.id },
        data: {
          completedDays,
          currentDayIndex: Math.min(completedDays + 1, duration),
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastReadOn: toDateColumn(streak.lastReadOn!),
          graceUsedOn: streak.graceUsedOn ? toDateColumn(streak.graceUsedOn) : null,
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
    });

    if (updated) return { ...updated, alreadyComplete: false };

    // The no-op path still answers with the current state, so a replayed
    // request and a first request look the same to the caller.
    const current = await this.prisma.memberPlanSubscription.findUnique({
      where: { id: subscription.id },
      select: {
        id: true,
        currentDayIndex: true,
        completedDays: true,
        currentStreak: true,
        longestStreak: true,
        status: true,
      },
    });
    return { ...current!, alreadyComplete: true };
  }

  /**
   * Undoes a completion, for a mis-tap.
   *
   * The streak is deliberately left where it is. Recomputing it would mean
   * replaying every completion date in order, and the failure mode of getting
   * that wrong is telling somebody their sixty day streak never happened.
   */
  async uncompleteDay(actor: AuthUser, subscriptionId: string, dayIndex: number) {
    const subscription = await this.ownedSubscription(actor, subscriptionId);

    return this.prisma.$transaction(async (tx) => {
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

      const completedDays = await this.progress.countCompleted(subscription.id, tx);
      const updated = await tx.memberPlanSubscription.update({
        where: { id: subscription.id },
        data: {
          completedDays,
          currentDayIndex: Math.min(completedDays + 1, subscription.Plan.durationDays),
          // Undoing the last day of a finished plan makes it active again.
          ...(subscription.status === SubscriptionStatus.COMPLETED
            ? { status: SubscriptionStatus.ACTIVE, completedAt: null }
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
    return { dayIndexes: await this.progress.completedDayIndexes(subscription.id) };
  }
}
