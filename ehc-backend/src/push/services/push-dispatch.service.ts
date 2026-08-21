import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PushSenderService } from './push-sender.service';
import { isWithinQuietHours } from './quiet-hours.util';
import {
  DEFAULT_PREFERENCES,
  QUIET_HOURS_EXEMPT,
  type DispatchResult,
  type PushCategory,
  type PushPayload,
} from '../push.types';

/** Subscriptions pushed at once. Keeps a church-wide send from opening thousands of sockets. */
const CONCURRENCY = 20;

/**
 * Consecutive transient failures before a subscription is treated as dead.
 * A 404/410 prunes immediately; this only covers endpoints that keep timing out.
 */
const MAX_FAILURES = 5;

interface Audience {
  /** Profile ids to consider. Empty array means nobody; undefined means everyone in the tenant. */
  userIds?: string[];
  tenantId: string;
}

/**
 * Resolves who should receive a notification, honours their preferences and
 * quiet hours, and sends in bounded batches.
 *
 * Deliberate design point: a notification suppressed by quiet hours is dropped,
 * not queued for later. Releasing a night's worth of held notifications at 06:00
 * produces exactly the burst that makes people disable notifications, and a
 * reminder for something that already happened is worse than silence. The one
 * category that genuinely cannot wait (a service starting) is exempt from quiet
 * hours instead.
 */
@Injectable()
export class PushDispatchService {
  private readonly logger = new Logger(PushDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: PushSenderService,
  ) {}

  async dispatch(
    category: PushCategory,
    audience: Audience,
    payload: PushPayload,
  ): Promise<DispatchResult> {
    const result: DispatchResult = {
      category,
      audienceSize: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
      pruned: 0,
    };

    if (!this.sender.isConfigured) {
      this.logger.warn(`[${category}] skipped — VAPID keys not configured`);
      return result;
    }
    if (audience.userIds && audience.userIds.length === 0) {
      return result;
    }

    const eligible = await this.resolveEligibleUsers(category, audience);
    result.audienceSize = eligible.length;
    if (eligible.length === 0) {
      this.logger.log(`[${category}] no eligible recipients`);
      return result;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { tenantId: audience.tenantId, userId: { in: eligible } },
      select: { id: true, endpoint: true, p256dh: true, auth: true, failureCount: true },
    });
    result.attempted = subscriptions.length;

    for (let i = 0; i < subscriptions.length; i += CONCURRENCY) {
      const batch = subscriptions.slice(i, i + CONCURRENCY);
      const outcomes = await Promise.all(
        batch.map((sub) => this.sender.send(sub, payload)),
      );

      const gone: string[] = [];
      const transient: { id: string; failureCount: number }[] = [];

      outcomes.forEach((outcome, index) => {
        const sub = batch[index];
        if (outcome.ok) {
          result.delivered += 1;
          return;
        }
        result.failed += 1;
        if (outcome.gone) {
          gone.push(sub.id);
        } else {
          transient.push({ id: sub.id, failureCount: sub.failureCount });
        }
      });

      // The push service said this endpoint no longer exists (404) or has been
      // unsubscribed (410). It will never work again, so delete rather than
      // retry: keeping it would inflate every future audience count and waste a
      // request per send, forever.
      if (gone.length) {
        const { count } = await this.prisma.pushSubscription.deleteMany({
          where: { id: { in: gone } },
        });
        result.pruned += count;
      }

      if (transient.length) {
        const exhausted = transient
          .filter((t) => t.failureCount + 1 >= MAX_FAILURES)
          .map((t) => t.id);
        const retryable = transient
          .filter((t) => t.failureCount + 1 < MAX_FAILURES)
          .map((t) => t.id);

        if (retryable.length) {
          await this.prisma.pushSubscription.updateMany({
            where: { id: { in: retryable } },
            data: { failureCount: { increment: 1 }, failedAt: new Date() },
          });
        }
        // Repeatedly failing without ever returning 404/410 — treat as dead too,
        // otherwise these accumulate indefinitely.
        if (exhausted.length) {
          const { count } = await this.prisma.pushSubscription.deleteMany({
            where: { id: { in: exhausted } },
          });
          result.pruned += count;
        }
      }

      // Reset the counter for anything that just succeeded, so one bad night
      // does not eventually prune a healthy device.
      const deliveredIds = batch
        .filter((_, index) => outcomes[index].ok)
        .map((s) => s.id);
      if (deliveredIds.length) {
        await this.prisma.pushSubscription.updateMany({
          where: { id: { in: deliveredIds }, failureCount: { gt: 0 } },
          data: { failureCount: 0, failedAt: null },
        });
      }
    }

    // Every dispatch is logged with category, audience size and outcome counts.
    this.logger.log(
      `[${category}] audience=${result.audienceSize} attempted=${result.attempted} ` +
        `delivered=${result.delivered} failed=${result.failed} pruned=${result.pruned}`,
    );

    return result;
  }

  /**
   * Sends to specific members without preference or quiet-hours filtering.
   *
   * Only for notifications the member has explicitly asked for in the moment,
   * which today means the "send me a test notification" button. Never use this
   * for anything broadcast: bypassing preferences on a real notification is
   * exactly the behaviour that makes people revoke permission.
   */
  async sendDirect(
    userIds: string[],
    tenantId: string | null,
    payload: PushPayload,
  ): Promise<DispatchResult> {
    const result: DispatchResult = {
      category: 'serviceStarting',
      audienceSize: userIds.length,
      attempted: 0,
      delivered: 0,
      failed: 0,
      pruned: 0,
    };
    if (!this.sender.isConfigured || userIds.length === 0) return result;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds }, ...(tenantId ? { tenantId } : {}) },
      select: { id: true, endpoint: true, p256dh: true, auth: true, failureCount: true },
    });
    result.attempted = subscriptions.length;

    const outcomes = await Promise.all(subscriptions.map((s) => this.sender.send(s, payload)));

    const gone: string[] = [];
    outcomes.forEach((outcome, index) => {
      if (outcome.ok) result.delivered += 1;
      else {
        result.failed += 1;
        if (outcome.gone) gone.push(subscriptions[index].id);
      }
    });

    if (gone.length) {
      const { count } = await this.prisma.pushSubscription.deleteMany({
        where: { id: { in: gone } },
      });
      result.pruned += count;
    }

    return result;
  }

  /**
   * Filters an audience down to members who want this category and are not
   * currently inside their quiet window.
   *
   * Members with no preference row are included when the category defaults to
   * on, so notifications work from day one without a backfill migration.
   */
  private async resolveEligibleUsers(
    category: PushCategory,
    audience: Audience,
  ): Promise<string[]> {
    const subscribers = await this.prisma.pushSubscription.findMany({
      where: {
        tenantId: audience.tenantId,
        ...(audience.userIds ? { userId: { in: audience.userIds } } : {}),
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    if (subscribers.length === 0) return [];

    const userIds = subscribers.map((s) => s.userId);
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { tenantId: audience.tenantId, userId: { in: userIds } },
    });
    const byUser = new Map(preferences.map((p) => [p.userId, p]));

    const now = new Date();
    const exempt = QUIET_HOURS_EXEMPT.has(category);

    return userIds.filter((userId) => {
      const pref = byUser.get(userId);

      if (!pref) return DEFAULT_PREFERENCES[category];
      if (!pref[category]) return false;
      if (exempt) return true;

      return !isWithinQuietHours(now, pref.quietStart, pref.quietEnd, pref.timezone);
    });
  }
}
