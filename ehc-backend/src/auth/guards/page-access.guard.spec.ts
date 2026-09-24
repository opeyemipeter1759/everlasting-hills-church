import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PageAccessGuard } from './page-access.guard';
import type { PageAccessService } from '../page-access/page-access.service';
import type { AuthUser } from '../types/auth-user';

function makeUser(role: Role, extra: Partial<AuthUser> = {}): AuthUser {
  return {
    userId: 'u1',
    email: 'a@b.c',
    role,
    effectiveRoles: [role],
    unitLeadOf: [],
    hodOf: [],
    headUsher: false,
    profileId: 'p1',
    memberId: 'm1',
    tenantId: 't1',
    ...extra,
  };
}

function makeRequest(user: AuthUser | undefined, path: string) {
  const req: { user?: AuthUser; path: string } = { user, path };
  const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
  return { req, ctx };
}

/** A PageAccessService stub granting exactly the listed page hrefs. */
function grants(...hrefs: string[]) {
  const canReach = jest.fn(async (_actor: AuthUser, href: string) => hrefs.includes(href));
  const isInAudioProduction = jest.fn(async () => false);
  return { service: { canReach, isInAudioProduction } as unknown as PageAccessService, canReach };
}

/** A PageAccessService stub for someone in the Audio (Post) Production unit. */
function audioProductionMember() {
  const isInAudioProduction = jest.fn(async () => true);
  const canReach = jest.fn(async () => false);
  return { service: { canReach, isInAudioProduction } as unknown as PageAccessService, isInAudioProduction };
}

describe('PageAccessGuard — Audio (Post) Production', () => {
  it.each(['/sermons/analytics', '/sermons/abc/featured', '/sermons/audio-upload-url', '/uploads/image'])(
    'gives a unit member Super Admin power on %s',
    async (path) => {
      const { service } = audioProductionMember();
      const { req, ctx } = makeRequest(makeUser(Role.MEMBER), path);

      await new PageAccessGuard(service).canActivate(ctx);

      expect(req.user?.role).toBe(Role.SUPER_ADMIN);
      expect(req.user?.effectiveRoles).toEqual([Role.MEMBER, Role.SUPER_ADMIN]);
    },
  );

  it('gives them nothing outside the Sermons section', async () => {
    const { service, isInAudioProduction } = audioProductionMember();
    const user = makeUser(Role.MEMBER);
    const { req, ctx } = makeRequest(user, '/members/abc');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(isInAudioProduction).not.toHaveBeenCalled();
    expect(req.user).toBe(user);
  });

  it('leaves people outside the unit as they are on sermon endpoints', async () => {
    const { service } = grants();
    const user = makeUser(Role.MEMBER);
    const { req, ctx } = makeRequest(user, '/sermons/analytics');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(req.user).toBe(user);
  });
});

describe('PageAccessGuard', () => {
  it("gives a member granted First Timers the page's role on its endpoints", async () => {
    const { service } = grants('/dashboard/admin/first-timers');
    const user = makeUser(Role.MEMBER);
    const { req, ctx } = makeRequest(user, '/visitors/abc');

    await expect(new PageAccessGuard(service).canActivate(ctx)).resolves.toBe(true);

    expect(req.user?.role).toBe(Role.ADMIN);
    expect(req.user?.effectiveRoles).toEqual([Role.MEMBER, Role.ADMIN]);
  });

  it('does not elevate someone who was not given the page', async () => {
    const { service } = grants();
    const user = makeUser(Role.MEMBER);
    const { req, ctx } = makeRequest(user, '/visitors');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(req.user).toBe(user);
    expect(req.user?.role).toBe(Role.MEMBER);
  });

  it("does not elevate on endpoints outside the granted page", async () => {
    const { service } = grants('/dashboard/admin/first-timers');
    const user = makeUser(Role.MEMBER);
    const { req, ctx } = makeRequest(user, '/pledges');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(req.user?.role).toBe(Role.MEMBER);
  });

  it('matches whole path segments only', async () => {
    const { service, canReach } = grants('/dashboard/admin/units');
    const { req, ctx } = makeRequest(makeUser(Role.MEMBER), '/units-archive');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(canReach).not.toHaveBeenCalled();
    expect(req.user?.role).toBe(Role.MEMBER);
  });

  it('never mutates the shared user object', async () => {
    const { service } = grants('/dashboard/admin/first-timers');
    const user = makeUser(Role.MEMBER);
    const { ctx } = makeRequest(user, '/visitors');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(user.role).toBe(Role.MEMBER);
    expect(user.effectiveRoles).toEqual([Role.MEMBER]);
  });

  it('skips the lookup when the role already clears the page', async () => {
    const { service, canReach } = grants('/dashboard/admin/first-timers');
    const user = makeUser(Role.PASTOR);
    const { req, ctx } = makeRequest(user, '/visitors');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(canReach).not.toHaveBeenCalled();
    expect(req.user).toBe(user);
  });

  it('never lowers a higher role', async () => {
    // HOD is lateral: it does not clear an ADMIN route, but ranks below it,
    // while a HEAD_USHER page grant for a PASTOR would never be consulted.
    const { service } = grants('/dashboard/admin/units');
    const user = makeUser(Role.HOD, { hodOf: ['d1'] });
    const { req, ctx } = makeRequest(user, '/units/u1');

    await new PageAccessGuard(service).canActivate(ctx);

    expect(req.user?.role).toBe(Role.ADMIN);
    expect(req.user?.effectiveRoles).toEqual([Role.HOD, Role.ADMIN]);
    expect(req.user?.hodOf).toEqual(['d1']);
  });

  it('lets public (signed-out) requests through untouched', async () => {
    const { service, canReach } = grants('/dashboard/admin/first-timers');
    const { req, ctx } = makeRequest(undefined, '/visitors');

    await expect(new PageAccessGuard(service).canActivate(ctx)).resolves.toBe(true);

    expect(canReach).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
