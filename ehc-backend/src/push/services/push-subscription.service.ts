import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { DEFAULT_PREFERENCES } from '../push.types';
import type { SubscribeInput, UpdatePreferencesInput } from '../push.schemas';

/**
 * Manages a member's push subscriptions and notification preferences.
 *
 * Every read and write is scoped by both tenantId and the caller's own
 * profileId, so a member can only ever reach their own rows. That is the
 * enforcement layer: RLS on these tables is a deny-all backstop against direct
 * database access, not a per-row policy (see the RLS migration for why).
 */
@Injectable()
export class PushSubscriptionService {
  private readonly logger = new Logger(PushSubscriptionService.name);
  private readonly defaultTenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.defaultTenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Registers a device. Upserts on endpoint, which the push service guarantees
   * unique, so re-subscribing the same browser refreshes the keys rather than
   * accumulating duplicate rows that would each get their own notification.
   */
  async subscribe(actor: AuthUser, input: SubscribeInput) {
    const userId = this.requireUserId(actor);
    const tenantId = actor.tenantId ?? this.defaultTenantId;

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        id: randomUUID(),
        tenantId,
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
      },
      update: {
        // Re-point the row at the current owner: on a shared device the same
        // browser endpoint can legitimately move to another member after a
        // logout, and leaving the old userId would send them each other's
        // notifications.
        tenantId,
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        lastSeenAt: new Date(),
        failureCount: 0,
        failedAt: null,
      },
    });

    return { subscribed: true };
  }

  /** Removes one device. Idempotent: unsubscribing twice is not an error. */
  async unsubscribe(actor: AuthUser, endpoint: string) {
    const userId = this.requireUserId(actor);
    const { count } = await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
    return { removed: count };
  }

  /**
   * The member's preferences, filled in with defaults for anything unset.
   * Never creates a row: reading settings should not write to the database.
   */
  async getPreferences(actor: AuthUser) {
    const userId = this.requireUserId(actor);
    const tenantId = actor.tenantId ?? this.defaultTenantId;

    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        ...DEFAULT_PREFERENCES,
        ...pickCategories(existing),
        quietStart: existing.quietStart,
        quietEnd: existing.quietEnd,
        timezone: existing.timezone,
      };
    }

    // Seed the sermon toggle from the pre-existing Member.notifyNewSermons flag
    // so a member who already opted out of sermon emails is not silently
    // opted back in by push.
    const member = await this.prisma.member.findFirst({
      where: { profileId: userId, tenantId },
      select: { notifyNewSermons: true },
    });

    return {
      ...DEFAULT_PREFERENCES,
      newSermon: member?.notifyNewSermons ?? DEFAULT_PREFERENCES.newSermon,
      quietStart: null,
      quietEnd: null,
      timezone: 'Africa/Lagos',
    };
  }

  async updatePreferences(actor: AuthUser, input: UpdatePreferencesInput) {
    const userId = this.requireUserId(actor);
    const tenantId = actor.tenantId ?? this.defaultTenantId;

    const data: Prisma.NotificationPreferenceUncheckedCreateInput = {
      id: randomUUID(),
      tenantId,
      userId,
      ...DEFAULT_PREFERENCES,
      ...stripUndefined(input),
      updatedAt: new Date(),
    };

    const updated = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: data,
      update: { ...stripUndefined(input), updatedAt: new Date() },
    });

    // Keep the legacy per-member sermon flag in step, so the two cannot drift
    // and contradict each other.
    if (typeof input.newSermon === 'boolean') {
      await this.prisma.member
        .updateMany({
          where: { profileId: userId, tenantId },
          data: { notifyNewSermons: input.newSermon },
        })
        .catch((err: Error) =>
          this.logger.warn(`notifyNewSermons sync failed: ${err.message}`),
        );
    }

    return {
      ...pickCategories(updated),
      quietStart: updated.quietStart,
      quietEnd: updated.quietEnd,
      timezone: updated.timezone,
    };
  }

  private requireUserId(actor: AuthUser): string {
    if (!actor.profileId) {
      throw new NotFoundException('No profile is linked to this account');
    }
    return actor.profileId;
  }
}

/** Drops undefined keys so a partial PATCH does not overwrite with undefined. */
function stripUndefined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function pickCategories(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.keys(DEFAULT_PREFERENCES).map((key) => [key, Boolean(row[key])]),
  ) as Record<keyof typeof DEFAULT_PREFERENCES, boolean>;
}
