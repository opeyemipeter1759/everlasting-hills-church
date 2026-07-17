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
  // Head usher: records congregation headcounts. Lateral specialist above unit lead.
  HEAD_USHER: 3,
  // HOD: appointed under a department by its Admin Head (or Pastor/Super Admin).
  HOD: 4,
  // Admin merged into Admin Head — one tier, same level. ADMIN is legacy (kept
  // only so existing grants keep working); ADMIN_HEAD is the name used going
  // forward and is fully interchangeable with it for every @Roles(...) gate.
  ADMIN_HEAD: 6,
  ADMIN: 6,
  PASTOR: 7,
  SUPER_ADMIN: 8,
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
    // Effective roles (grants + assignments) are the source of truth. A user
    // passes if ANY of their effective roles meets the required level, preserving
    // hierarchy (e.g. PASTOR clears an ADMIN route) while supporting multi-role.
    const effective = user?.effectiveRoles?.length ? user.effectiveRoles : user?.role ? [user.role] : [];
    if (effective.length === 0) {
      throw new ForbiddenException('No role assigned to user');
    }

    const userLevel = Math.max(...effective.map((r) => ROLE_LEVEL[r] ?? 0));
    const minRequiredLevel = Math.min(...required.map((r) => ROLE_LEVEL[r]));

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Requires role ${required.join(' or ')} (you have ${effective.join(', ')})`,
      );
    }

    return true;
  }
}
