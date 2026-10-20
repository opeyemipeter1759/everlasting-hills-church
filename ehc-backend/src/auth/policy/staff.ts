import { Role } from '@prisma/client';
import type { AuthUser } from '../types/auth-user';

/**
 * One definition of "church staff" for the API: the roles that moderate content,
 * run classes and confirm membership. Services used to each keep their own copy
 * of this list; they read it from here so a change is made once.
 *
 * Roles come from AuthUser.effectiveRoles, which JwtStrategy resolves on every
 * request from live RoleGrant and assignment rows, never from a client cookie.
 */
export const STAFF_ROLES: readonly Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/** Pastors and admins: may confirm full membership and run every class. */
export const MEMBERSHIP_APPROVER_ROLES: readonly Role[] = STAFF_ROLES;

/**
 * Who may approve an application to join a class: Super Admin, Pastor and Admin Head.
 * ADMIN is the legacy name for the same tier as ADMIN_HEAD and keeps working.
 */
export const CLASS_APPROVER_ROLES: readonly Role[] = [Role.SUPER_ADMIN, Role.PASTOR, Role.ADMIN_HEAD, Role.ADMIN];

export function hasAnyRole(actor: Pick<AuthUser, 'effectiveRoles'> | null | undefined, roles: readonly Role[]): boolean {
  return (actor?.effectiveRoles ?? []).some((role) => roles.includes(role));
}

export function isStaff(actor: Pick<AuthUser, 'effectiveRoles'> | null | undefined): boolean {
  return hasAnyRole(actor, STAFF_ROLES);
}
