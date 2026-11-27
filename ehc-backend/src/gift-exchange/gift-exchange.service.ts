import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GiftEntryStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { giftExchangeTarget, toLagosIso } from './gift-exchange-target';
import type { GiftExchangeChoiceDto } from './dto/gift-exchange.dto';

const REJECTED_MESSAGE =
  "Your interest in the gift exchange and picnic was declined by the church admin, so you can't register again. Please speak to an admin if you think this is a mistake.";

/**
 * A member's side of the gift exchange & picnic: they choose either or both. The member is always the signed-in
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
        ? this.prisma.giftExchangeEntry.findUnique({ where: { memberId: actor.memberId }, select: { status: true, rejectionReason: true, giftExchange: true, picnic: true } })
        : null,
      this.prisma.giftExchangeEntry.count({ where: { tenantId: this.tenantId, status: GiftEntryStatus.INTERESTED } }),
    ]);
    return {
      registered: !!entry,
      status: entry?.status ?? null,
      giftExchange: entry?.giftExchange ?? false,
      picnic: entry?.picnic ?? false,
      rejectionReason: entry?.rejectionReason ?? null,
      totalInterested,
      // Always sent so the card can say when it is; the countdown itself only shows once in.
      targetDate: toLagosIso(giftExchangeTarget(now, this.targetOverride)),
      serverTime: now.toISOString(),
    };
  }

  /**
   * Joins, or changes what the member joined. At least one of the two is required
   * (to leave both, withdraw). Rejected: 403.
   */
  async register(actor: AuthUser, choice: GiftExchangeChoiceDto) {
    const memberId = this.memberIdOf(actor);
    if (!choice.giftExchange && !choice.picnic) {
      throw new BadRequestException('Choose the gift exchange, the picnic, or both.');
    }
    // The picnic includes the gift exchange: anyone coming to the picnic takes part in both.
    const data = { giftExchange: choice.giftExchange || choice.picnic, picnic: choice.picnic };
    const existing = await this.prisma.giftExchangeEntry.findUnique({ where: { memberId }, select: { status: true } });
    if (existing?.status === GiftEntryStatus.REJECTED) throw new ForbiddenException(REJECTED_MESSAGE);
    if (existing) {
      await this.prisma.giftExchangeEntry.update({ where: { memberId }, data });
    } else {
      try {
        await this.prisma.giftExchangeEntry.create({ data: { id: randomUUID(), tenantId: this.tenantId, memberId, ...data } });
      } catch (err) {
        // A double tap can race the unique constraint: the entry now exists, so save the choice on it.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
        await this.prisma.giftExchangeEntry.updateMany({ where: { memberId, status: GiftEntryStatus.INTERESTED }, data });
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
    if (!actor.memberId) throw new ForbiddenException('Your account is not linked to a member profile, so it cannot join the gift exchange or picnic.');
    return actor.memberId;
  }
}
