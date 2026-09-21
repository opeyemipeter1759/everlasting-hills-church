import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { PAGE_ACCESS, pathUnder } from '../page-access/page-access.map';
import { PageAccessService } from '../page-access/page-access.service';
import type { AuthUser } from '../types/auth-user';
import { meetsRole, ROLE_LEVEL } from './roles.guard';

/**
 * Makes a page permission mean "can do everything on that page".
 *
 * The Role Access Permissions screen can give someone a page their role
 * wouldn't normally reach. The frontend then lets them onto the page, but the
 * API checks roles, not pages — so every load, save and delete on it failed.
 *
 * For a request to an endpoint a restricted page uses (PAGE_ACCESS), when the
 * person's own role falls short of that page's role but they have been given
 * the page, this treats them as holding the page's role FOR THIS REQUEST ONLY.
 * RolesGuard and every role check inside the services then see that role, so
 * the page works exactly as it does for someone who holds it. Their other
 * requests are untouched.
 *
 * Registered as a global guard after JwtAuthGuard (needs req.user) and before
 * RolesGuard (which must see the elevated role). Never blocks anything itself.
 */
@Injectable()
export class PageAccessGuard implements CanActivate {
  constructor(private readonly pageAccess: PageAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser; path?: string }>();
    const user = req.user;
    if (!user) return true; // @Public route, or not signed in

    const path = req.path ?? '';
    const effective = effectiveRolesOf(user);
    const candidates = PAGE_ACCESS.filter(
      (page) => page.paths.some((prefix) => pathUnder(path, prefix)) && !meetsRole(effective, page.role),
    );
    if (candidates.length === 0) return true;

    // Highest page role first, so a person given several pages that share an
    // endpoint gets the most capable of them.
    candidates.sort((a, b) => ROLE_LEVEL[b.role] - ROLE_LEVEL[a.role]);
    for (const page of candidates) {
      if (await this.pageAccess.canReach(user, page.href)) {
        req.user = elevate(user, page.role);
        break;
      }
    }
    return true;
  }
}

function effectiveRolesOf(user: AuthUser): Role[] {
  if (user.effectiveRoles?.length) return user.effectiveRoles;
  return user.role ? [user.role] : [];
}

/**
 * A copy of `user` that also holds `role`. A copy, never a mutation: the
 * resolved user may be cached and shared across requests, and the elevation
 * must not outlive this one.
 */
function elevate(user: AuthUser, role: Role): AuthUser {
  const effective = effectiveRolesOf(user);
  const outranks = !user.role || ROLE_LEVEL[role] > ROLE_LEVEL[user.role];
  return {
    ...user,
    role: outranks ? role : user.role,
    effectiveRoles: effective.includes(role) ? effective : [...effective, role],
    headUsher: user.headUsher || role === 'HEAD_USHER',
  };
}
