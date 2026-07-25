import { Role } from '@prisma/client';

// ADMIN_HEAD is merged with ADMIN (same level) — full, unscoped unit management,
// not limited to units inside a department they personally head (that narrower
// path is scoped separately, for HOD / department-only heads).
export const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];
