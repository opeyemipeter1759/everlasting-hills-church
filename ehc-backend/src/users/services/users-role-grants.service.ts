import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { EffectiveRolesService } from '../../auth/effective-roles.service';
import { GRANTED_ROLES } from '../users.types';
import { UsersAuthService } from './users-auth.service';

/** Additive multi-role grants (PASTOR/ADMIN/SUPER_ADMIN) and the global Head Usher assignment. */
@Injectable()
export class UsersRoleGrantsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: UsersAuthService,
    private readonly effectiveRoles: EffectiveRolesService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private async assertTargetInTenant(profileId: string) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, tenantId: true },
    });
    if (!target || target.tenantId !== this.tenantId) throw new NotFoundException('User not found');
  }

  /** Grant a global role. History-preserving; idempotent on the active (user, role). */
  async grantRole(actor: AuthUser, profileId: string, role: Role) {
    if (!GRANTED_ROLES.includes(role)) {
      throw new BadRequestException(`${role} is a derived role; assign it via a unit or department, not a grant`);
    }
    await this.assertTargetInTenant(profileId);
    this.auth.assertCanActOn(actor, role);
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    const existing = await this.prisma.roleGrant.findFirst({
      where: { userId: profileId, role, endedAt: null },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.roleGrant.create({
        data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, role, grantedById: actor.profileId ?? null },
      });
      await this.auth.writeAudit(actor, 'GRANT_ROLE', profileId, { role });
      this.effectiveRoles.invalidate(profileId);
    }
    return { granted: role };
  }

  /** End an active grant (history-preserving). Revoking ADMIN_HEAD also ends a
   * legacy ADMIN grant if present (same merged role, different underlying row). */
  async revokeGrant(actor: AuthUser, profileId: string, role: Role) {
    await this.assertTargetInTenant(profileId);
    this.auth.assertCanActOn(actor, role);
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    const roleValues = role === Role.ADMIN_HEAD ? [Role.ADMIN_HEAD, Role.ADMIN] : [role];
    await this.prisma.roleGrant.updateMany({
      where: { userId: profileId, role: { in: roleValues }, endedAt: null },
      data: { endedAt: new Date() },
    });
    await this.auth.writeAudit(actor, 'REVOKE_ROLE', profileId, { role });
    this.effectiveRoles.invalidate(profileId);
    return { revoked: role };
  }

  /** Assign Head Usher — global, unscoped (unlike ADMIN_HEAD/HOD/UNIT_LEAD, no
   * department or unit target), so it's additive like a grant even though it's
   * backed by HeadUsherAssignment rather than RoleGrant. History-preserving. */
  async assignHeadUsher(actor: AuthUser, profileId: string) {
    await this.assertTargetInTenant(profileId);
    this.auth.assertCanActOn(actor, Role.HEAD_USHER);
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    const existing = await this.prisma.headUsherAssignment.findFirst({
      where: { userId: profileId, endedAt: null },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.headUsherAssignment.create({
        data: { id: randomUUID(), tenantId: this.tenantId, userId: profileId, assignedById: actor.profileId ?? null },
      });
      await this.auth.writeAudit(actor, 'ASSIGN_HEAD_USHER', profileId, { role: Role.HEAD_USHER });
      this.effectiveRoles.invalidate(profileId);
    }
    return { assigned: Role.HEAD_USHER };
  }

  async removeHeadUsher(actor: AuthUser, profileId: string) {
    await this.assertTargetInTenant(profileId);
    this.auth.assertCanActOn(actor, Role.HEAD_USHER);
    this.auth.assertCanActOn(actor, await this.auth.targetPrimaryRole(profileId));

    await this.prisma.headUsherAssignment.updateMany({
      where: { userId: profileId, endedAt: null },
      data: { endedAt: new Date() },
    });
    await this.auth.writeAudit(actor, 'REMOVE_HEAD_USHER', profileId, { role: Role.HEAD_USHER });
    this.effectiveRoles.invalidate(profileId);
    return { removed: Role.HEAD_USHER };
  }
}
