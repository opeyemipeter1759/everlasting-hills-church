import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import type { SetMemberRoleDto } from '../dto/unit.dto';
import { ADMIN_ROLES } from '../units.util';
import { UnitLeadSyncService } from './unit-lead-sync.service';

@Injectable()
export class UnitsRoleService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadSync: UnitLeadSyncService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * HOD / ADMIN_HEAD scoped path into setMemberRole: only within a unit whose
   * department they actively head/HOD, and only for isLead (never isAssistant).
   */
  private async assertCanAssignUnitLeadScoped(actor: AuthUser, unitId: string, dto: SetMemberRoleDto) {
    if (dto.isAssistant) {
      throw new ForbiddenException('Only ADMIN+ can assign assistants');
    }
    if (!actor.profileId) {
      throw new ForbiddenException('No profile on your account');
    }
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, tenantId: this.tenantId },
      select: { departmentId: true },
    });
    if (!unit?.departmentId) {
      throw new ForbiddenException('This unit is not part of a department you head');
    }
    const [head, hod] = await Promise.all([
      this.prisma.departmentHead.findFirst({
        where: { tenantId: this.tenantId, departmentId: unit.departmentId, userId: actor.profileId, endedAt: null },
        select: { id: true },
      }),
      this.prisma.departmentHod.findFirst({
        where: { tenantId: this.tenantId, departmentId: unit.departmentId, userId: actor.profileId, endedAt: null },
        select: { id: true },
      }),
    ]);
    if (!head && !hod) {
      throw new ForbiddenException('This unit is not part of a department you head');
    }
  }

  /**
   * Set the lead/assistant role for an existing unit member.
   * ADMIN+ may change any unit. HOD / ADMIN_HEAD may only appoint a LEAD (not an
   * assistant), and only within a unit whose department they actively head/HOD —
   * "HOD are the one that can create unit Head".
   */
  async setMemberRole(actor: AuthUser, unitId: string, memberId: string, dto: SetMemberRoleDto) {
    const isFullAdmin = Boolean(actor.role && ADMIN_ROLES.includes(actor.role));
    if (!isFullAdmin) {
      await this.assertCanAssignUnitLeadScoped(actor, unitId, dto);
    }

    if (dto.isLead && dto.isAssistant) {
      throw new BadRequestException('A member cannot be both lead and assistant');
    }

    const link = await this.prisma.unitMember.findFirst({
      where: { unitId, memberId, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!link) throw new NotFoundException('Member not in this unit');

    const updated = await this.prisma.unitMember.update({
      where: { id: link.id },
      data: {
        ...(dto.isLead !== undefined && { isLead: dto.isLead }),
        ...(dto.isAssistant !== undefined && { isAssistant: dto.isAssistant }),
      },
    });

    if (dto.isLead !== undefined) {
      const member = await this.prisma.member.findUnique({ where: { id: memberId }, select: { profileId: true } });
      if (member) await this.leadSync.syncUnitLeadAssignment(actor, unitId, member.profileId, dto.isLead);
    }

    return updated;
  }
}
