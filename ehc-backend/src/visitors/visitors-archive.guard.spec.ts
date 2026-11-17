import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { VisitorsController } from './visitors.controller';

/**
 * DELETE /visitors/:id archives a first-timer, and only Admin, Admin Head,
 * Pastor and Super Admin may do it. Read from the real decorators on the
 * controller, so loosening the gate breaks this test.
 *
 * The database side: RLS is enabled with no policies on every table (the repo
 * convention), so the anon and authenticated roles can delete nothing at all;
 * only the API, which connects as a role that bypasses RLS, writes here.
 */
function context(roles: Role[]): ExecutionContext {
  const user: Partial<AuthUser> = { role: roles[0], effectiveRoles: roles, unitLeadOf: [], hodOf: [] };
  return {
    getHandler: () => VisitorsController.prototype.archive,
    getClass: () => VisitorsController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('archiving a first-timer (DELETE /visitors/:id)', () => {
  const guard = new RolesGuard(new Reflector());

  it.each([
    ['a follow-up team member', [Role.MEMBER]],
    ['a unit lead', [Role.MEMBER, Role.UNIT_LEAD]],
    ['a head of department', [Role.MEMBER, Role.HOD]],
    ['the first-timer contact', [Role.MEMBER, Role.FIRST_TIMER_CONTACT]],
    ['the head usher', [Role.MEMBER, Role.HEAD_USHER]],
  ])('refuses %s with 403', (_who, roles) => {
    expect(() => guard.canActivate(context(roles))).toThrow(ForbiddenException);
  });

  it.each([Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN])('lets %s archive', (role) => {
    expect(guard.canActivate(context([Role.MEMBER, role]))).toBe(true);
  });

  it('is an archive, not a delete: the route calls archive and nothing else', () => {
    expect(Object.getOwnPropertyNames(VisitorsController.prototype)).not.toContain('delete');
  });
});
