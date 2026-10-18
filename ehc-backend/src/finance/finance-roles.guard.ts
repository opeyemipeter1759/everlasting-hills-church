import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';

const FINANCE_ROLES = new Set<Role>([Role.PASTOR, Role.FINANCE_HEAD, Role.SUPER_ADMIN]);

/**
 * Finance data is restricted more tightly than the normal role hierarchy
 * allows: an Admin or Admin Head outranks Finance Head everywhere else in the
 * app, but must NOT see tithe/offering/income/expense records. So this checks
 * effective roles for an exact match against the three allowed roles rather
 * than going through RolesGuard's level comparison (where any CHURCH_WIDE
 * role — Admin included — passes anything a lower-level role gates).
 *
 * Applied at the controller level instead of @Roles(), which would still let
 * Admin/Admin Head through via that level comparison. The global RolesGuard
 * still runs first (via APP_GUARD) but no-ops here since there's no @Roles()
 * metadata on these routes — this guard is the real check.
 */
@Injectable()
export class FinanceRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const effective = user?.effectiveRoles?.length ? user.effectiveRoles : user?.role ? [user.role] : [];
    const allowed = effective.some((r) => FINANCE_ROLES.has(r));
    if (!allowed) {
      throw new ForbiddenException('Finance records are restricted to Pastor, Finance Head, and Super Admin');
    }
    return true;
  }
}
