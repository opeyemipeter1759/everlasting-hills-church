import { Role } from "@prisma/client";

const ROLE_HIERARCHY: Role[] = [
  Role.VISITOR,
  Role.MEMBER,
  Role.UNIT_LEAD,
  Role.ADMIN,
  Role.PASTOR,
  Role.SUPER_ADMIN,
];

export function hasRole(userRole: Role, required: Role): boolean {
  return userRole === required;
}

export function hasMinimumRole(userRole: Role, minimum: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minimum);
}

export function isAdmin(role: Role): boolean {
  return hasMinimumRole(role, Role.ADMIN);
}
