import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';

/**
 * Issues and revokes the per-member calendar feed token.
 *
 * The token is the only credential on the feed URL, because calendar clients
 * (Google, Apple, Outlook) fetch on a schedule with no way to attach a bearer
 * header. That makes two properties non-negotiable:
 *
 *   unguessable — 32 bytes from crypto.randomBytes, base64url. Brute-forcing
 *                 this is not meaningfully different from brute-forcing a
 *                 session token, and the feed endpoint is rate limited on top.
 *   revocable   — regenerating sets revokedAt on the old row rather than
 *                 deleting it, so a leaked URL provably stops working instead
 *                 of being silently recycled to someone else.
 */
@Injectable()
export class CalendarTokenService {
  private readonly logger = new Logger(CalendarTokenService.name);
  private readonly defaultTenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.defaultTenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private newToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Returns the caller's active token, creating one on first use.
   *
   * A DB partial unique index enforces one active token per user, so a race
   * between two tabs surfaces as P2002 rather than two live tokens; that case
   * re-reads the winner instead of failing the request.
   */
  async getOrCreate(actor: AuthUser): Promise<{ token: string; createdAt: Date }> {
    const userId = this.requireUserId(actor);
    const tenantId = actor.tenantId ?? this.defaultTenantId;

    const existing = await this.prisma.calendarFeedToken.findFirst({
      where: { userId, tenantId, revokedAt: null },
      select: { token: true, createdAt: true },
    });
    if (existing) return existing;

    try {
      return await this.prisma.calendarFeedToken.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId,
          token: this.newToken(),
        },
        select: { token: true, createdAt: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const winner = await this.prisma.calendarFeedToken.findFirst({
          where: { userId, tenantId, revokedAt: null },
          select: { token: true, createdAt: true },
        });
        if (winner) return winner;
      }
      throw err;
    }
  }

  /**
   * Revokes the current token and issues a new one, in one transaction so a
   * failure cannot leave the member with no active token.
   */
  async regenerate(actor: AuthUser): Promise<{ token: string; createdAt: Date }> {
    const userId = this.requireUserId(actor);
    const tenantId = actor.tenantId ?? this.defaultTenantId;

    return this.prisma.$transaction(async (tx) => {
      await tx.calendarFeedToken.updateMany({
        where: { userId, tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return tx.calendarFeedToken.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId,
          token: this.newToken(),
        },
        select: { token: true, createdAt: true },
      });
    });
  }

  /**
   * Resolves a feed token to its owner. Returns null for unknown or revoked
   * tokens so the caller can 404 both identically — distinguishing them would
   * confirm that a guessed token once existed.
   */
  async resolve(token: string): Promise<{ userId: string; tenantId: string } | null> {
    const row = await this.prisma.calendarFeedToken.findUnique({
      where: { token },
      select: { id: true, userId: true, tenantId: true, revokedAt: true },
    });

    if (!row || row.revokedAt) return null;

    // Fire-and-forget: a failed access-time write must never break the feed.
    this.prisma.calendarFeedToken
      .update({ where: { id: row.id }, data: { lastAccessedAt: new Date() } })
      .catch((err: Error) =>
        this.logger.warn(`lastAccessedAt update failed for feed token: ${err.message}`),
      );

    return { userId: row.userId, tenantId: row.tenantId };
  }

  private requireUserId(actor: AuthUser): string {
    if (!actor.profileId) {
      throw new NotFoundException('No profile is linked to this account');
    }
    return actor.profileId;
  }
}
