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
  /** Department ids the user is an active HOD of (DepartmentHod). */
  hodOf: string[];
  /** Whether the user has an active head-usher assignment. */
  headUsher: boolean;
  /** Highest-level effective role, for hierarchy checks + legacy `actor.role` reads. */
  primaryRole: Role;
}

/**
 * Resolves a user's effective roles from grants + active assignments. This is the
 * single source of truth for authorization; the JWT carries identity only, so the
 * set is resolved per request.
 *
 * A short-TTL in-memory cache backs single-user lookups: every guarded request was
 * paying 5 DB round trips just to resolve roles, uncached. Mutating call sites
 * (grant/revoke role, assign/remove unit lead, department head, HOD, head usher)
 * call `invalidate()` so changes are reflected on their very next request; the TTL
 * below only bounds staleness for any call site that doesn't (or a direct DB edit).
 *
 * "User" here means a Profile (Profile.id); MEMBER is the universal implicit base.
 */
const CACHE_TTL_MS = 15_000;

@Injectable()
export class EffectiveRolesService {
  private readonly cache = new Map<string, { value: EffectiveRoles; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /** Call after any mutation to a user's grants/assignments so the change is visible immediately. */
  invalidate(profileId: string): void {
    this.cache.delete(profileId);
  }

  private primaryOf(roles: Role[]): Role {
    return roles.reduce((best, r) => (ROLE_LEVELS[r] > ROLE_LEVELS[best] ? r : best), Role.MEMBER);
  }

  private assemble(
    grants: Role[],
    unitLeadOf: string[],
    adminHeadOf: string[],
    hodOf: string[],
    headUsher: boolean,
  ): EffectiveRoles {
    const roles = new Set<Role>([Role.MEMBER, ...grants]);
    if (unitLeadOf.length) roles.add(Role.UNIT_LEAD);
    if (adminHeadOf.length) roles.add(Role.ADMIN_HEAD);
    if (hodOf.length) roles.add(Role.HOD);
    if (headUsher) roles.add(Role.HEAD_USHER);
    const list = [...roles];
    return { roles: list, unitLeadOf, adminHeadOf, hodOf, headUsher, primaryRole: this.primaryOf(list) };
  }

  /** Effective roles for one user. */
  async getEffectiveRoles(profileId: string | null | undefined): Promise<EffectiveRoles> {
    if (!profileId) return this.assemble([], [], [], [], false);

    const cached = this.cache.get(profileId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const [grants, unitLeads, deptHeads, deptHods, usher] = await Promise.all([
      this.prisma.roleGrant.findMany({ where: { userId: profileId, endedAt: null }, select: { role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { userId: profileId, endedAt: null }, select: { unitId: true } }),
      this.prisma.departmentHead.findMany({ where: { userId: profileId, endedAt: null }, select: { departmentId: true } }),
      this.prisma.departmentHod.findMany({ where: { userId: profileId, endedAt: null }, select: { departmentId: true } }),
      this.prisma.headUsherAssignment.findFirst({ where: { userId: profileId, endedAt: null }, select: { id: true } }),
    ]);
    const result = this.assemble(
      grants.map((g) => g.role),
      unitLeads.map((u) => u.unitId),
      deptHeads.map((d) => d.departmentId),
      deptHods.map((d) => d.departmentId),
      Boolean(usher),
    );
    this.cache.set(profileId, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }

  /**
   * Batch resolver for lists (member directory, role rollups): 5 grouped queries
   * instead of N per-user resolutions.
   */
  async getEffectiveRolesBatch(profileIds: string[]): Promise<Map<string, EffectiveRoles>> {
    const out = new Map<string, EffectiveRoles>();
    if (profileIds.length === 0) return out;
    const ids = [...new Set(profileIds)];
    const [grants, unitLeads, deptHeads, deptHods, ushers] = await Promise.all([
      this.prisma.roleGrant.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, role: true } }),
      this.prisma.unitLeadAssignment.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, unitId: true } }),
      this.prisma.departmentHead.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, departmentId: true } }),
      this.prisma.departmentHod.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true, departmentId: true } }),
      this.prisma.headUsherAssignment.findMany({ where: { userId: { in: ids }, endedAt: null }, select: { userId: true } }),
    ]);
    const grantMap = new Map<string, Role[]>();
    const leadMap = new Map<string, string[]>();
    const deptMap = new Map<string, string[]>();
    const hodMap = new Map<string, string[]>();
    const usherSet = new Set(ushers.map((u) => u.userId));
    for (const g of grants) (grantMap.get(g.userId) ?? grantMap.set(g.userId, []).get(g.userId)!).push(g.role);
    for (const u of unitLeads) (leadMap.get(u.userId) ?? leadMap.set(u.userId, []).get(u.userId)!).push(u.unitId);
    for (const d of deptHeads) (deptMap.get(d.userId) ?? deptMap.set(d.userId, []).get(d.userId)!).push(d.departmentId);
    for (const h of deptHods) (hodMap.get(h.userId) ?? hodMap.set(h.userId, []).get(h.userId)!).push(h.departmentId);
    for (const id of ids) {
      out.set(id, this.assemble(grantMap.get(id) ?? [], leadMap.get(id) ?? [], deptMap.get(id) ?? [], hodMap.get(id) ?? [], usherSet.has(id)));
    }
    return out;
  }
}
