import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { leaveServiceTeams } from '../../members/leave-service-teams';
import { ENTRY_INCLUDE } from '../follow-up.types';
import { inactiveAmong, optOutDeactivated, restoreReactivated } from '../deactivation-stage';
import { FollowUpAuthService } from './follow-up-auth.service';
import { FollowUpEntryMapperService } from './follow-up-entry-mapper.service';
import { FollowUpAuditService } from './follow-up-audit.service';

/** Opting a member out of / restoring their login access via a Follow-Up entry. */
@Injectable()
export class FollowUpMemberStatusService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FollowUpAuthService,
    private readonly mapper: FollowUpEntryMapperService,
    private readonly audit: FollowUpAuditService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Opts a member out: blocks their login (enforced in AuthService) until restored.
   * Only this entry's team lead (or ADMIN+) may do this, and only for ABSENTEE
   * entries — FIRST_TIMER entries are Visitor-backed and have no login to block. */
  async optOutMember(actor: AuthUser, id: string) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!(await this.auth.canLeadUnit(actor, entry.unitId))) {
      throw new ForbiddenException('Only this team\'s leader can opt a member out');
    }
    if (!entry.memberId) {
      throw new BadRequestException('Only a follow-up entry linked to a member can be opted out');
    }

    const memberId = entry.memberId;
    const leadsEnded = await this.prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data: { status: MemberStatus.OPTED_OUT } });
      // Opting out deactivates them, and a deactivated member serves on no team.
      const ended = await leaveServiceTeams(tx, this.tenantId, [memberId], actor.userId);
      await optOutDeactivated(tx, this.tenantId, [memberId], actor.userId);
      return ended;
    });
    leadsEnded.forEach((profileId) => this.effectiveRoles.invalidate(profileId));
    await this.audit.write({ action: 'OPT_OUT', entity: 'Member', entityId: memberId, actorId: actor.userId });

    const updated = await this.prisma.followUpEntry.findFirstOrThrow({ where: { id }, include: ENTRY_INCLUDE });
    return this.mapper.mapEntry(updated, actor);
  }

  /** Reverses optOutMember — restores login access. Same authorization as opting out. */
  async restoreMember(actor: AuthUser, id: string) {
    const entry = await this.prisma.followUpEntry.findFirst({ where: { id, tenantId: this.tenantId } });
    if (!entry) throw new NotFoundException('Follow-up entry not found');
    if (!(await this.auth.canLeadUnit(actor, entry.unitId))) {
      throw new ForbiddenException('Only this team\'s leader can restore a member');
    }
    if (!entry.memberId) {
      throw new BadRequestException('Only a follow-up entry linked to a member can be restored');
    }

    const memberId = entry.memberId;
    await this.prisma.$transaction(async (tx) => {
      const returning = await inactiveAmong(tx, this.tenantId, [memberId]);
      await tx.member.update({ where: { id: memberId }, data: { status: MemberStatus.ACTIVE } });
      await restoreReactivated(tx, this.tenantId, returning, actor.userId);
    });
    await this.audit.write({ action: 'RESTORE', entity: 'Member', entityId: entry.memberId, actorId: actor.userId });

    const updated = await this.prisma.followUpEntry.findFirstOrThrow({ where: { id }, include: ENTRY_INCLUDE });
    return this.mapper.mapEntry(updated, actor);
  }
}
