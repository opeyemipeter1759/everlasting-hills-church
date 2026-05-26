import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to one or more roles.
 * Hierarchy is enforced in RolesGuard (e.g. @Roles(Role.PASTOR) also admits SUPER_ADMIN).
 *
 * Usage:
 *   @Roles(Role.PASTOR)
 *   @Get('analytics')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
