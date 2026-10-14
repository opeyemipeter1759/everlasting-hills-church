import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { InboxService } from '../../inbox/inbox.service';
import { MemberSelfLookupService } from './member-self-lookup.service';

export const MARITAL_STATUSES = ['SINGLE', 'MARRIED'] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

const PERSON = { id: true, firstName: true, lastName: true, photoUrl: true } as const;
type Person = { id: string; firstName: string; lastName: string; photoUrl: string | null };
const person = (m: Person) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim(), photoUrl: m.photoUrl });

/** Married unless told otherwise; older records have only the wedding date. */
export function effectiveMaritalStatus(m: { maritalStatus: string | null; weddingAnniversary: Date | null }): MaritalStatus {
  if (m.maritalStatus === 'MARRIED' || m.maritalStatus === 'SINGLE') return m.maritalStatus;
  return m.weddingAnniversary ? 'MARRIED' : 'SINGLE';
}

/**
 * Linking a member to their spouse.
 *
 * A member names their spouse; the spouse is asked, and nothing shows on
 * either profile until they accept. Accepting links both members to each
 * other. Either can later remove the link, which removes it for both.
 */
@Injectable()
export class MemberSpouseService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly selfLookup: MemberSelfLookupService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async me(userId: string, email?: string) {
    const { memberId } = await this.selfLookup.getMyMember(userId, email);
    return memberId;
  }

  /** My marital status, spouse, and any requests waiting on me or on them. */
  async mine(userId: string, email?: string) {
    const memberId = await this.me(userId, email);
    const [member, sent, received] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { maritalStatus: true, weddingAnniversary: true, spouseName: true, Spouse: { select: PERSON } },
      }),
      this.prisma.spouseRequest.findFirst({
        where: { fromMemberId: memberId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, To: { select: PERSON } },
      }),
      this.prisma.spouseRequest.findMany({
        where: { toMemberId: memberId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, From: { select: PERSON } },
      }),
    ]);
    if (!member) throw new NotFoundException('Member not found');
    return {
      maritalStatus: effectiveMaritalStatus(member),
      spouse: member.Spouse ? person(member.Spouse) : null,
      spouseName: member.spouseName,
      pendingSent: sent ? { id: sent.id, createdAt: sent.createdAt, to: person(sent.To) } : null,
      pendingReceived: received.map((r) => ({ id: r.id, createdAt: r.createdAt, from: person(r.From) })),
    };
  }

  /** Ask another member to confirm they are my spouse. */
  async request(userId: string, toMemberId: string, email?: string) {
    const memberId = await this.me(userId, email);
    if (toMemberId === memberId) throw new BadRequestException('Choose your spouse, not yourself.');
    const [self, target] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: memberId }, select: { ...PERSON, spouseMemberId: true } }),
      this.prisma.member.findFirst({
        where: { id: toMemberId, tenantId: this.tenantId, status: MemberStatus.ACTIVE },
        select: { ...PERSON, profileId: true, spouseMemberId: true },
      }),
    ]);
    if (!self) throw new NotFoundException('Member not found');
    if (!target) throw new NotFoundException('That member could not be found.');
    if (self.spouseMemberId) throw new BadRequestException('Remove your current spouse link first.');
    if (target.spouseMemberId) throw new BadRequestException(`${person(target).name} is already linked to a spouse.`);

    // They already asked me: asking them back is agreeing.
    const theirs = await this.prisma.spouseRequest.findFirst({
      where: { fromMemberId: toMemberId, toMemberId: memberId, status: 'PENDING' },
      select: { id: true },
    });
    if (theirs) return this.respond(userId, theirs.id, true, email);

    await this.prisma.$transaction([
      this.prisma.spouseRequest.updateMany({
        where: { fromMemberId: memberId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      }),
      this.prisma.spouseRequest.create({
        data: { id: randomUUID(), tenantId: this.tenantId, fromMemberId: memberId, toMemberId },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: { maritalStatus: 'MARRIED', spouseName: null },
      }),
    ]);
    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: target.profileId,
        title: `${person(self).name} listed you as their spouse`,
        body: 'Confirm it to show you as married to each other on your profiles.',
        type: 'spouse-request',
        link: '/dashboard/settings',
      },
    ]);
    return this.mine(userId, email);
  }

  /** Accept or decline a request sent to me. */
  async respond(userId: string, requestId: string, accept: boolean, email?: string) {
    const memberId = await this.me(userId, email);
    const req = await this.prisma.spouseRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        toMemberId: true,
        fromMemberId: true,
        From: { select: { ...PERSON, profileId: true, spouseMemberId: true, weddingAnniversary: true } },
        To: { select: { ...PERSON, spouseMemberId: true, weddingAnniversary: true } },
      },
    });
    if (!req || req.toMemberId !== memberId) throw new ForbiddenException('That request is not yours to answer.');
    if (req.status !== 'PENDING') throw new BadRequestException('That request has already been answered.');
    const now = new Date();

    if (!accept) {
      await this.prisma.spouseRequest.update({ where: { id: req.id }, data: { status: 'DECLINED', respondedAt: now } });
      await this.inbox.createMany([
        {
          tenantId: this.tenantId,
          profileId: req.From.profileId,
          title: `${person(req.To).name} did not confirm being your spouse`,
          body: 'Nothing has been added to your profiles.',
          type: 'spouse-declined',
          link: '/dashboard/settings',
        },
      ]);
      return this.mine(userId, email);
    }

    if (req.From.spouseMemberId || req.To.spouseMemberId) {
      throw new BadRequestException('One of you is already linked to a spouse.');
    }
    // One wedding date for the couple: whichever of them has given one.
    const wedding = req.From.weddingAnniversary ?? req.To.weddingAnniversary ?? null;
    const both = [req.fromMemberId, req.toMemberId];
    await this.prisma.$transaction([
      this.prisma.spouseRequest.update({ where: { id: req.id }, data: { status: 'ACCEPTED', respondedAt: now } }),
      // Any other open asks involving either of them no longer apply.
      this.prisma.spouseRequest.updateMany({
        where: {
          status: 'PENDING',
          id: { not: req.id },
          OR: [{ fromMemberId: { in: both } }, { toMemberId: { in: both } }],
        },
        data: { status: 'CANCELLED', respondedAt: now },
      }),
      this.prisma.member.update({
        where: { id: req.fromMemberId },
        data: { spouseMemberId: req.toMemberId, maritalStatus: 'MARRIED', spouseName: null, weddingAnniversary: wedding },
      }),
      this.prisma.member.update({
        where: { id: req.toMemberId },
        data: { spouseMemberId: req.fromMemberId, maritalStatus: 'MARRIED', spouseName: null, weddingAnniversary: wedding },
      }),
    ]);
    await this.inbox.createMany([
      {
        tenantId: this.tenantId,
        profileId: req.From.profileId,
        title: `${person(req.To).name} confirmed you are married`,
        body: 'You now show as spouses on each other’s profiles.',
        type: 'spouse-accepted',
        link: '/dashboard/profile',
      },
    ]);
    return this.mine(userId, email);
  }

  /** Withdraw the request I sent. */
  async cancel(userId: string, email?: string) {
    const memberId = await this.me(userId, email);
    await this.prisma.spouseRequest.updateMany({
      where: { fromMemberId: memberId, status: 'PENDING' },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });
    return this.mine(userId, email);
  }

  /** Remove the spouse link, for both of us. */
  async unlink(userId: string, email?: string) {
    const memberId = await this.me(userId, email);
    await this.prisma.$transaction(this.unlinkOps(memberId));
    return this.mine(userId, email);
  }

  /** Clears the link on both sides, and withdraws any ask I have open. */
  unlinkOps(memberId: string): Prisma.PrismaPromise<unknown>[] {
    const now = new Date();
    return [
      this.prisma.member.updateMany({ where: { spouseMemberId: memberId }, data: { spouseMemberId: null } }),
      this.prisma.member.update({ where: { id: memberId }, data: { spouseMemberId: null } }),
      this.prisma.spouseRequest.updateMany({
        where: { status: 'PENDING', fromMemberId: memberId },
        data: { status: 'CANCELLED', respondedAt: now },
      }),
    ];
  }
}
