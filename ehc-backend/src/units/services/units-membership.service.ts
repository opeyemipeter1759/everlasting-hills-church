import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { AssignUnitMemberDto } from '../dto/unit.dto';
import { ADMIN_ROLES } from '../units.util';
import { UnitLeadSyncService } from './unit-lead-sync.service';

@Injectable()
export class UnitsMembershipService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadSync: UnitLeadSyncService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Throws ForbiddenException unless:
   *   - actor is ADMIN / PASTOR / SUPER_ADMIN, OR
   *   - actor is the LEAD or ASSISTANT of THIS unit
   */
  async assertCanManageUnit(actor: AuthUser, unitId: string) {
    if (actor.role && ADMIN_ROLES.includes(actor.role)) return;

    if (actor.role === Role.UNIT_LEAD || actor.role === Role.MEMBER) {
      if (!actor.memberId) {
        throw new ForbiddenException('No member record on your account');
      }
      const membership = await this.prisma.unitMember.findFirst({
        where: {
          unitId,
          memberId: actor.memberId,
          tenantId: this.tenantId,
          OR: [{ isLead: true }, { isAssistant: true }],
        },
        select: { id: true },
      });
      if (!membership) {
        throw new ForbiddenException('You are not a lead or assistant of this unit');
      }
      return;
    }

    throw new ForbiddenException('Insufficient role to manage units');
  }

  async addMember(actor: AuthUser, unitId: string, data: AssignUnitMemberDto) {
    await this.assertCanManageUnit(actor, unitId);

    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, tenantId: this.tenantId },
      select: { id: true, profileId: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (data.isLead && data.isAssistant) {
      throw new BadRequestException('A member cannot be both lead and assistant');
    }

    try {
      const um = await this.prisma.unitMember.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          unitId,
          memberId: data.memberId,
          isLead: data.isLead ?? false,
          isAssistant: data.isAssistant ?? false,
        },
        include: {
          Member: {
            select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, status: true },
          },
        },
      });
      if (data.isLead) {
        await this.leadSync.syncUnitLeadAssignment(actor, unitId, member.profileId, true);
      }
      return {
        id: um.id,
        memberId: um.memberId,
        isLead: um.isLead,
        isAssistant: um.isAssistant,
        Member: {
          id: um.Member.id,
          firstName: um.Member.firstName,
          lastName: um.Member.lastName,
          email: um.Member.email,
          photoUrl: um.Member.photoUrl,
          status: um.Member.status,
        },
      };
    } catch {
      throw new BadRequestException('Member is already in this unit');
    }
  }

  async removeMember(actor: AuthUser, unitId: string, memberId: string) {
    await this.assertCanManageUnit(actor, unitId);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId: this.tenantId },
      select: { profileId: true },
    });

    const result = await this.prisma.unitMember.deleteMany({
      where: { unitId, memberId, tenantId: this.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Member not in this unit');

    if (member) await this.leadSync.syncUnitLeadAssignment(actor, unitId, member.profileId, false);
    return { unitId, memberId, removed: true };
  }
}
