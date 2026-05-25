import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user';

/**
 * Role hierarchy. Higher number subsumes everything below.
 * VISITOR exists in the Prisma enum but is treated as level 0 (no dashboard access).
 */
const ROLE_LEVEL: Record<Role, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  ADMIN: 3,
  PASTOR: 4,
  SUPER_ADMIN: 5,
};

/**
 * Enforces @Roles(...). Hierarchical: if a route requires PASTOR, SUPER_ADMIN also passes.
 *
 * Registered globally in AuthModule via APP_GUARD. Runs AFTER JwtAuthGuard, so req.user
 * is always populated when this runs (unless the route is @Public, in which case we skip).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      // No @Roles() on this route — auth alone is enough.
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user?.role) {
      throw new ForbiddenException('No role assigned to user');
    }

    const userLevel = ROLE_LEVEL[user.role];
    const minRequiredLevel = Math.min(...required.map((r) => ROLE_LEVEL[r]));

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Requires role ${required.join(' or ')} (you are ${user.role})`,
      );
    }

    return true;
  }
}
