import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { GRANTED_ROLES } from '../users.types';
import type { UpdateUserDto, UpdateUserRoleDto } from '../dto/user.dto';
import { UsersAuthService } from './users-auth.service';

@Injectable()
export class UsersUpdateService {
  private readonly logger = new Logger(UsersUpdateService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: UsersAuthService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /**
   * Set a user's single granted role (backward-compatible with the People
   * dropdown). Ends all active grants, then applies the target: a granted role
   * becomes a RoleGrant, HEAD_USHER an assignment, MEMBER clears grants. Scoped
   * roles (UNIT_LEAD / ADMIN_HEAD) come from unit / department assignment flows.
   * For additive multi-role, use grantRole / revokeGrant instead.
   */
  async updateRole(actor: AuthUser, profileId: string, data: UpdateUserRoleDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true, userId: true, Member: { select: { email: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }

    // Actor must out-rank BOTH the current effective role and the new role.
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));
    this.auth.assertCanActOn(actor, data.role);

    await this.prisma.$transaction(async (tx) => {
      await tx.roleGrant.updateMany({ where: { userId: profileId, endedAt: null }, data: { endedAt: new Date() } });
      if (GRANTED_ROLES.includes(data.role)) {
        await tx.roleGrant.create({
          data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, role: data.role, grantedById: actor.profileId ?? null },
        });
      } else if (data.role === Role.HEAD_USHER) {
        const existing = await tx.headUsherAssignment.findFirst({ where: { userId: profileId, endedAt: null }, select: { id: true } });
        if (!existing) {
          await tx.headUsherAssignment.create({
            data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, assignedById: actor.profileId ?? null },
          });
        }
      }
    });

    await this.auth.writeAudit(actor, 'SET_ROLE', profileId, { role: data.role });
    this.effectiveRoles.invalidate(profileId);
    this.logger.log(`[${actor.email}] set ${target.Member?.email ?? target.userId} role -> ${data.role}`);
    return { profileId, role: data.role };
  }

  async updateProfile(actor: AuthUser, profileId: string, data: UpdateUserDto) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    if (!target.Member) {
      throw new BadRequestException('User has no Member record to update');
    }

    return this.prisma.member.update({
      where: { id: target.Member.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
      },
    });
  }

  /** Soft deactivate — kept for callers that explicitly want INACTIVE status. */
  async deactivate(actor: AuthUser, profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true, Member: { select: { id: true } } },
    });
    if (!target || target.tenantId !== this.tenantId) {
      throw new NotFoundException('User not found');
    }
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    if (!target.Member) {
      throw new BadRequestException('User has no Member record');
    }

    return this.prisma.member.update({
      where: { id: target.Member.id },
      data: { status: 'INACTIVE' },
    });
  }
}
