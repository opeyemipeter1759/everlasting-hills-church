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
 */
export const ROLE_LEVELS: Record<Role, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  ADMIN: 3,
  PASTOR: 4,
  SUPER_ADMIN: 5,
};

export function canActOnRole(actorRole: Role | null | undefined, targetRole: Role): boolean {
  if (!actorRole) return false;
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
  return (Object.keys(ROLE_LEVELS) as Role[]).filter(
    (r) => ROLE_LEVELS[r] < actorLevel && r !== 'VISITOR',
  );
}
