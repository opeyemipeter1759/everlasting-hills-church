import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipApprovalStatus, MembershipStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { MEMBERSHIP_APPROVER_ROLES, STAFF_ROLES, hasAnyRole } from '../auth/policy/staff';

/**
 * Membership status and every change to it.
 *
 *   created by an admin            -> IN_TRAINING   (event CREATED)
 *   finishes the Membership Class  -> a "ready for membership" approval, PENDING
 *   a Pastor or Admin confirms     -> FULL          (event APPROVAL)
 *   a Pastor or Admin overrides    -> either status (event EXCEPTION, reason required)
 *
 * Completing the class never sets FULL by itself.
 */
@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private assertApprover(actor: AuthUser) {
    if (!hasAnyRole(actor, MEMBERSHIP_APPROVER_ROLES)) {
      throw new ForbiddenException('Only a Pastor or Admin can change membership status');
    }
  }

  /** Raises "ready for membership" once per completed enrollment, and tells the approvers. */
  async raiseApproval(memberId: string, courseId: string, enrollmentId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { membershipStatus: true, firstName: true, lastName: true },
    });
    if (!member || member.membershipStatus === MembershipStatus.FULL) return null;
    const existing = await this.prisma.membershipApproval.findUnique({ where: { enrollmentId } });
    if (existing) return existing;
    const approval = await this.prisma.membershipApproval.create({
      data: { id: randomUUID(), tenantId: this.tenantId, memberId, courseId, enrollmentId },
    });
    const approvers = await this.prisma.roleGrant.findMany({
      where: { tenantId: this.tenantId, endedAt: null, role: { in: [...STAFF_ROLES] } },
      select: { userId: true },
    });
    const name = `${member.firstName} ${member.lastName}`.trim();
    await this.inbox
      .createMany(
        Array.from(new Set(approvers.map((a) => a.userId))).map((profileId) => ({
          tenantId: this.tenantId,
          profileId,
          type: 'membership-approval',
          title: `${name} is ready for membership`,
          body: 'They have completed the Membership Class. Confirm them as a full member.',
          link: '/dashboard/admin/classes?tab=approvals',
        })),
      )
      .catch((err: Error) => this.logger.warn(`Approval notification failed: ${err.message}`));
    return approval;
  }

  async listApprovals(actor: AuthUser, status: MembershipApprovalStatus = MembershipApprovalStatus.PENDING) {
    this.assertApprover(actor);
    const rows = await this.prisma.membershipApproval.findMany({
      where: { tenantId: this.tenantId, status },
      orderBy: { createdAt: status === MembershipApprovalStatus.PENDING ? 'asc' : 'desc' },
      take: 200,
      select: {
        id: true,
        status: true,
        createdAt: true,
        decidedAt: true,
        note: true,
        Course: { select: { title: true, slug: true } },
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, email: true, membershipStatus: true } },
      },
    });
    return rows;
  }

  async decide(actor: AuthUser, approvalId: string, confirm: boolean, note?: string) {
    this.assertApprover(actor);
    const approval = await this.prisma.membershipApproval.findFirst({
      where: { id: approvalId, tenantId: this.tenantId },
      select: { id: true, status: true, memberId: true, Member: { select: { profileId: true, membershipStatus: true } } },
    });
    if (!approval) throw new NotFoundException('That approval is gone');
    if (approval.status !== MembershipApprovalStatus.PENDING) throw new BadRequestException('That approval has already been decided');
    const now = new Date();
    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.membershipApproval.update({
        where: { id: approval.id },
        data: {
          status: confirm ? MembershipApprovalStatus.CONFIRMED : MembershipApprovalStatus.DECLINED,
          decidedAt: now,
          decidedById: actor.profileId,
          note: note?.trim() || null,
        },
      }),
    ];
    if (confirm && approval.Member.membershipStatus !== MembershipStatus.FULL) {
      ops.push(
        this.prisma.member.update({
          where: { id: approval.memberId },
          data: { membershipStatus: MembershipStatus.FULL, membershipConfirmedAt: now },
        }),
        this.prisma.membershipEvent.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            memberId: approval.memberId,
            fromStatus: approval.Member.membershipStatus,
            toStatus: MembershipStatus.FULL,
            method: 'APPROVAL',
            reason: note?.trim() || 'Completed the Membership Class',
            actorProfileId: actor.profileId,
          },
        }),
      );
    }
    await this.prisma.$transaction(ops);
    await this.inbox
      .createMany([
        {
          tenantId: this.tenantId,
          profileId: approval.Member.profileId,
          type: 'membership-status',
          title: confirm ? 'Welcome: you are now a member of Everlasting Hills Church' : 'About your membership',
          body: confirm
            ? 'A pastor has confirmed your membership. Your certificate is ready under My Classes.'
            : note?.trim() || 'A pastor will be in touch about your next step.',
          link: '/dashboard/classes',
        },
      ])
      .catch((err: Error) => this.logger.warn(`Membership notification failed: ${err.message}`));
    return { id: approval.id, status: confirm ? 'CONFIRMED' : 'DECLINED' };
  }

  /** The exception path: a Pastor or Admin sets the status directly, with a reason on record. */
  async setStatus(actor: AuthUser, memberId: string, status: MembershipStatus, reason: string) {
    this.assertApprover(actor);
    const why = reason.trim();
    if (why.length < 5) throw new BadRequestException('Give a reason of at least a few words; it is kept on record.');
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId },
      select: { id: true, membershipStatus: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.membershipStatus === status) return { memberId, membershipStatus: status, changed: false };
    await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: memberId },
        data: { membershipStatus: status, membershipConfirmedAt: status === MembershipStatus.FULL ? new Date() : null },
      }),
      this.prisma.membershipEvent.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          memberId,
          fromStatus: member.membershipStatus,
          toStatus: status,
          method: 'EXCEPTION',
          reason: why,
          actorProfileId: actor.profileId,
        },
      }),
    ]);
    return { memberId, membershipStatus: status, changed: true };
  }

  /** A member's status now and every change to it (staff). */
  async history(actor: AuthUser, memberId: string) {
    if (!hasAnyRole(actor, STAFF_ROLES)) throw new ForbiddenException('Only pastors and admins can see this');
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId },
      select: { membershipStatus: true, membershipConfirmedAt: true, creditedSundays: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    const events = await this.prisma.membershipEvent.findMany({
      where: { memberId, tenantId: this.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, fromStatus: true, toStatus: true, method: true, reason: true, actorProfileId: true, createdAt: true },
    });
    return { ...member, events };
  }
}
