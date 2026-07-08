import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_LEVELS } from '../users/role-hierarchy';

export interface EffectiveRoles {
  /** The union: MEMBER + granted roles + roles derived from active assignments. */
  roles: Role[];
  /** Unit ids the user actively leads (UnitLeadAssignment). */
  unitLeadOf: string[];
  /** Department ids the user actively heads (DepartmentHead). */
  adminHeadOf: string[];
  /** Whether the user has an active head-usher assignment. */
  headUsher: boolean;
  /** Highest-level effective role, for hierarchy checks + legacy `actor.role` reads. */
  primaryRole: Role;
}

/**
 * Resolves a user's effective roles from grants + active assignments. This is the
 * single source of truth for authorization; the JWT carries identity only, so the
 * set is resolved per request and reflects revocations immediately.
 *
 * "User" here means a Profile (Profile.id); MEMBER is the universal implicit base.
 */
@Injectable()
export class EffectiveRolesService {
  constructor(private readonly prisma: PrismaService) {}

  private primaryOf(roles: Role[]): Role {
    return roles.reduce((best, r) => (ROLE_LEVELS[r] > ROLE_LEVELS[best] ? r : best), Role.MEMBER);
  }

  private assemble(
    grants: Role[],
    unitLeadOf: string[],
    adminHeadOf: string[],
    headUsher: boolean,
  ): EffectiveRoles {
    const roles = new Set<Role>([Role.MEMBER, ...grants]);
    if (unitLeadOf.length) roles.add(Role.UNIT_LEAD);
    if (adminHeadOf.length) roles.add(Role.ADMIN_HEAD);
    if (headUsher) roles.add(Role.HEAD_USHER);
    const list = [...roles];
    return { roles: list, unitLeadOf, adminHeadOf, headUsher, primaryRole: this.primaryOf(list) };
  }

  /** Effective roles for one user. */
  async getEffectiveRoles(profileId: string | null | undefined): Promise<EffectiveRoles> {
    if (!profileId) return this.assemble([], [], [], false);
    const [grants, unitLeads, deptHeads, usher] = await Promise.all([
      this.prisma.roleGrant.findMany({ where: { userId: profileId, endedAt: null }, select: { role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { userId: profileId, endedAt: null }, select: { unitId: true } }),
      this.prisma.departmentHead.findMany({ where: { userId: profileId, endedAt: null }, select: { departmentId: true } }),
      this.prisma.headUsherAssignment.findFirst({ where: { userId: profileId, endedAt: null }, select: { id: true } }),
    ]);
    return this.assemble(
      grants.map((g) => g.role),
      unitLeads.map((u) => u.unitId),
      deptHeads.map((d) => d.departmentId),
      Boolean(usher),
    );
  }

  /**
   * Batch resolver for lists (member directory, role rollups): 4 grouped queries
   * instead of N per-user resolutions.
   */
  async getEffectiveRolesBatch(profileIds: string[]): Promise<Map<string, EffectiveRoles>> {
    const out = new Map<string, EffectiveRoles>();
    if (profileIds.length === 0) return out;
    const ids = [...new Set(profileIds)];
    const [grants, unitLeads, deptHeads, ushers] = await Promise.all([
      this.prisma.roleGrant.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, unitId: true } }),
      this.prisma.departmentHead.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, departmentId: true } }),
      this.prisma.headUsherAssignment.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true } }),
    ]);
    const grantMap = new Map<string, Role[]>();
    const leadMap = new Map<string, string[]>();
    const deptMap = new Map<string, string[]>();
    const usherSet = new Set(ushers.map((u) => u.userId));
    for (const g of grants) (grantMap.get(g.userId) ?? grantMap.set(g.userId, []).get(g.userId)!).push(g.role);
    for (const u of unitLeads) (leadMap.get(u.userId) ?? leadMap.set(u.userId, []).get(u.userId)!).push(u.unitId);
    for (const d of deptHeads) (deptMap.get(d.userId) ?? deptMap.set(d.userId, []).get(d.userId)!).push(d.departmentId);
    for (const id of ids) {
      out.set(id, this.assemble(grantMap.get(id) ?? [], leadMap.get(id) ?? [], deptMap.get(id) ?? [], usherSet.has(id)));
    }
    return out;
  }
}
