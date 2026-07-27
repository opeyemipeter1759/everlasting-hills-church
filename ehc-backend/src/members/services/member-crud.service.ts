import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import type { UpdateMemberInput } from '../members.types';

/** Admin CRUD on a single member: read, edit core fields, change status. */
@Injectable()
export class MemberCrudService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getMemberById(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        Profile: { select: { id: true } },
        EngagementScore: true,
        AttendanceRecord: {
          include: { Service: true },
          orderBy: { Service: { scheduledAt: 'desc' } },
          take: 20,
        },
        PastorNote: { orderBy: { createdAt: 'desc' } },
        FollowUpTask: { orderBy: { createdAt: 'desc' } },
        UnitMember: { include: { Unit: true } },
        CareAsMember: {
          where: { status: 'ACTIVE' },
          include: { Leader: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
        CareAsLeader: {
          where: { status: 'ACTIVE' },
          include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
        },
      },
    });
    if (!member) return null;
    // Effective role (grants + assignments) exposed as Profile.role + top-level role.
    const role = member.Profile
      ? (await this.effectiveRoles.getEffectiveRoles(member.Profile.id)).primaryRole
      : Role.MEMBER;
    return { ...member, role, Profile: member.Profile ? { ...member.Profile, role } : null };
  }

  /** Admin edit of a member's core fields. */
  async updateMemberDetails(id: string, dto: UpdateMemberInput) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId: this.tenantId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const data: Prisma.MemberUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase() || null;
    if (dto.address !== undefined) data.address = dto.address.trim() || null;
    if (dto.gender !== undefined) {
      const g = (dto.gender ?? '').toUpperCase();
      data.gender = g === 'MALE' || g === 'FEMALE' ? g : null;
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }

    return this.prisma.member.update({ where: { id }, data });
  }

  async updateMemberStatus(memberId: string, status: string) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: { status } as any,
    });
  }
}
