import { Role } from '@prisma/client';

/**
 * Role hierarchy — must match the frontend's config.ts LEVELS.
 *
 * Authorization rule across the app: an actor can act on a target ONLY if the actor's
 * level is STRICTLY GREATER than the target's level. This is intentional —
 *   - SUPER_ADMIN can create/edit PASTOR but not another SUPER_ADMIN
 *   - PASTOR can create/edit ADMIN but not another PASTOR or SUPER_ADMIN
 *   - ADMIN can create/edit UNIT_LEAD and MEMBER but not another ADMIN, PASTOR, etc.
 *   - UNIT_LEAD and below cannot create users (they manage memberships only)
 *
 * Promoting peers requires elevation OR direct DB access — deliberate friction.
 * The one exception: SUPER_ADMIN may create/grant another SUPER_ADMIN ("access
 * to everything"), enforced explicitly in canActOnRole below.
 */
export const ROLE_LEVELS: Record<Role, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  // Head usher: records congregation headcounts. Lateral specialist above unit lead.
  HEAD_USHER: 3,
  // HOD: appointed by an Admin Head (or Pastor/Super Admin) under a department.
  // Own capability is appointing Unit Leads within that department's units.
  HOD: 4,
  // Admin merged into Admin Head — one tier, full church-wide access (People,
  // Units, Departments, Courses, Services, etc.), same level as legacy ADMIN.
  // ADMIN is kept only so existing grants keep working; it's no longer offered
  // anywhere as a new assignment — ADMIN_HEAD is the sole name going forward.
  ADMIN_HEAD: 6,
  ADMIN: 6,
  PASTOR: 7,
  SUPER_ADMIN: 8,
};

export function canActOnRole(actorRole: Role | null | undefined, targetRole: Role): boolean {
  if (!actorRole) return false;
  if (actorRole === Role.SUPER_ADMIN && targetRole === Role.SUPER_ADMIN) return true;
  return ROLE_LEVELS[actorRole] > ROLE_LEVELS[targetRole];
}

/**
 * Returns the list of roles the given actor is allowed to create or assign.
 * Used by the frontend to filter the role dropdown so users never see options
 * they're not allowed to pick (cleaner UX than letting the API reject after-the-fact).
 */
export function assignableRoles(actorRole: Role | null | undefined): Role[] {
  if (!actorRole) return [];
  const actorLevel = ROLE_LEVELS[actorRole];
  const roles = (Object.keys(ROLE_LEVELS) as Role[]).filter(
    // ADMIN is legacy (merged into ADMIN_HEAD) — never offered for new assignment.
    (r) => ROLE_LEVELS[r] < actorLevel && r !== 'VISITOR' && r !== Role.ADMIN,
  );
  // Mirror the canActOnRole peer exception: a Super Admin may also grant Super Admin.
  if (actorRole === Role.SUPER_ADMIN) roles.push(Role.SUPER_ADMIN);
  return roles;
}
