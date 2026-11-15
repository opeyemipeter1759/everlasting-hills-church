import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GiftEntryStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { giftExchangeTarget, toLagosIso } from './gift-exchange-target';

const REJECTED_MESSAGE =
  "Your interest in the gift exchange was declined by the church admin, so you can't register again. Please speak to an admin if you think this is a mistake.";

/**
 * A member's side of the gift exchange. The member is always the signed-in
 * person (never from the body or URL). Members see only the total count,
 * never who else is in. A rejected entry stays rejected: registering again is
 * refused and withdrawing leaves it as it is.
 */
@Injectable()
export class GiftExchangeService {
  private readonly tenantId: string;
  private readonly targetOverride?: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.targetOverride = config.get('GIFT_EXCHANGE_TARGET_DATE', { infer: true }) || undefined;
  }

  async me(actor: AuthUser) {
    const now = new Date();
    const [entry, totalInterested] = await Promise.all([
      actor.memberId
        ? this.prisma.giftExchangeEntry.findUnique({ where: { memberId: actor.memberId }, select: { status: true, rejectionReason: true } })
        : null,
      this.prisma.giftExchangeEntry.count({ where: { tenantId: this.tenantId, status: GiftEntryStatus.INTERESTED } }),
    ]);
    const interested = entry?.status === GiftEntryStatus.INTERESTED;
    return {
      registered: !!entry,
      status: entry?.status ?? null,
      rejectionReason: entry?.rejectionReason ?? null,
      totalInterested,
      targetDate: interested ? toLagosIso(giftExchangeTarget(now, this.targetOverride)) : null,
      serverTime: now.toISOString(),
    };
  }

  /** Shows interest. Already in: nothing changes. Rejected: 403. */
  async register(actor: AuthUser) {
    const memberId = this.memberIdOf(actor);
    const existing = await this.prisma.giftExchangeEntry.findUnique({ where: { memberId }, select: { status: true } });
    if (existing?.status === GiftEntryStatus.REJECTED) throw new ForbiddenException(REJECTED_MESSAGE);
    if (!existing) {
      try {
        await this.prisma.giftExchangeEntry.create({ data: { id: randomUUID(), tenantId: this.tenantId, memberId } });
      } catch (err) {
        // A double tap can race the unique constraint: the entry exists, which is all we wanted.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      }
    }
    return this.me(actor);
  }

  /** Withdraws. Not registered: nothing to do. Rejected: left as it is. */
  async withdraw(actor: AuthUser) {
    if (actor.memberId) {
      await this.prisma.giftExchangeEntry.deleteMany({ where: { memberId: actor.memberId, status: GiftEntryStatus.INTERESTED } });
    }
    return this.me(actor);
  }

  private memberIdOf(actor: AuthUser): string {
    if (!actor.memberId) throw new ForbiddenException('Your account is not linked to a member profile, so it cannot join the gift exchange.');
    return actor.memberId;
  }
}
