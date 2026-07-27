import { Role } from '@prisma/client';

/** Roles stored as explicit grants (everything else is derived from assignments).
 * ADMIN_HEAD is grantable here for a church-wide appointment (independent of
 * heading any specific department — that's the separate DepartmentHead scope,
 * which additionally derives ADMIN_HEAD for that person once assigned to a
 * department). ADMIN is legacy — merged into ADMIN_HEAD (same level) — kept
 * only so existing grants still work. HOD is deliberately NOT grantable here:
 * it's only ever assigned scoped to a specific department, via
 * DepartmentsService.assignHod (POST /departments/:id/hods). */
export const GRANTED_ROLES: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];
