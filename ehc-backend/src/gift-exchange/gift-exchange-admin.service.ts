import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GiftEntryStatus } from '@prisma/client';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { giftExchangeTarget, toLagosIso } from './gift-exchange-target';

/** The admin side of the gift exchange: everyone who showed interest, and rejecting or reinstating an entry. */
@Injectable()
export class GiftExchangeAdminService {
  private readonly tenantId: string;
  private readonly targetOverride?: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.targetOverride = config.get('GIFT_EXCHANGE_TARGET_DATE', { infer: true }) || undefined;
  }

  async list(status?: GiftEntryStatus) {
    const where = { tenantId: this.tenantId, ...(status ? { status } : {}) };
    const [entries, grouped] = await Promise.all([
      this.prisma.giftExchangeEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, memberId: true, status: true, rejectionReason: true, reviewedAt: true, createdAt: true,
          Member: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      this.prisma.giftExchangeEntry.groupBy({ by: ['status'], where: { tenantId: this.tenantId }, _count: { _all: true } }),
    ]);
    const countOf = (s: GiftEntryStatus) => grouped.find((g) => g.status === s)?._count._all ?? 0;
    return {
      targetDate: toLagosIso(giftExchangeTarget(new Date(), this.targetOverride)),
      counts: {
        INTERESTED: countOf(GiftEntryStatus.INTERESTED),
        REJECTED: countOf(GiftEntryStatus.REJECTED),
        total: grouped.reduce((n, g) => n + g._count._all, 0),
      },
      entries: entries.map(({ Member, ...e }) => ({
        ...e,
        name: `${Member.firstName} ${Member.lastName}`.trim(),
        email: Member.email,
        phone: Member.phone,
      })),
    };
  }

  async reject(actor: AuthUser, id: string, reason?: string) {
    await this.findOrThrow(id);
    return this.prisma.giftExchangeEntry.update({
      where: { id },
      data: { status: GiftEntryStatus.REJECTED, rejectionReason: reason?.trim() || null, reviewedById: actor.profileId, reviewedAt: new Date() },
      select: { id: true, status: true, rejectionReason: true, reviewedAt: true },
    });
  }

  async reinstate(actor: AuthUser, id: string) {
    await this.findOrThrow(id);
    return this.prisma.giftExchangeEntry.update({
      where: { id },
      data: { status: GiftEntryStatus.INTERESTED, rejectionReason: null, reviewedById: actor.profileId, reviewedAt: new Date() },
      select: { id: true, status: true, rejectionReason: true, reviewedAt: true },
    });
  }

  private async findOrThrow(id: string) {
    const entry = await this.prisma.giftExchangeEntry.findFirst({ where: { id, tenantId: this.tenantId }, select: { id: true } });
    if (!entry) throw new NotFoundException('Gift exchange entry not found');
  }
}
