import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpPipelineController } from './follow-up-pipeline.controller';
import { FollowUpAuthService } from './services/follow-up-auth.service';

const actor = (o: Partial<AuthUser> = {}): AuthUser =>
  ({ userId: 'u', profileId: 'p', memberId: 'me', effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], ...o }) as AuthUser;

/** The auth service over a church with a Follow-Up unit and an Integration Team. */
function auth(o: { integrationMembers?: string[] } = {}) {
  const prisma = {
    unit: {
      findMany: jest.fn(async ({ where }) =>
        String(where?.name?.contains).includes('integration')
          ? [{ id: 'u-int', name: 'Integration Team', departmentId: 'd' }]
          : [{ id: 'u-fu', name: 'Follow-Up', departmentId: 'd' }],
      ),
      findFirst: jest.fn(async () => ({ departmentId: 'd' })),
    },
    unitMember: { findFirst: jest.fn(async ({ where }) => ((o.integrationMembers ?? []).includes(where.memberId) ? { id: 'um' } : null)) },
  };
  return new FollowUpAuthService(prisma as never, { get: () => 't1' } as never);
}

describe('whose first-timers a person may read', () => {
  it('gives the whole list to those who run or feed the work', async () => {
    expect(await auth().firstTimerScope(actor({ effectiveRoles: [Role.MEMBER, Role.ADMIN] }))).toBeNull();
    expect(await auth().firstTimerScope(actor({ effectiveRoles: [Role.MEMBER, Role.FIRST_TIMER_CONTACT] }))).toBeNull();
    expect(await auth().firstTimerScope(actor({ unitLeadOf: ['u-fu'] }))).toBeNull();
    expect(await auth().firstTimerScope(actor({ hodOf: ['d'] }))).toBeNull();
    expect(await auth({ integrationMembers: ['me'] }).firstTimerScope(actor())).toBeNull();
  });

  it('pins a Follow-Up team member, or a lead of another team, to their own', async () => {
    expect(await auth().firstTimerScope(actor())).toBe('me');
    expect(await auth().firstTimerScope(actor({ unitLeadOf: ['u-choir'] }))).toBe('me');
    expect(await auth().firstTimerScope(actor({ memberId: null }))).toBe('no-member');
  });
});

describe('the first-timer list and profile, for a team member', () => {
  const setup = () => {
    const pipeline = {
      list: jest.fn(async () => ({ rows: [], total: 0, counts: {} })),
      year: jest.fn(async () => ({})),
      breakdowns: jest.fn(async () => ({})),
      one: jest.fn(async (id: string) => ({ visitorId: id, assigneeId: id === 'mine' ? 'me' : 'ruth' })),
    };
    const scoped = { requireAccess: jest.fn(), firstTimerScope: jest.fn(async () => 'me') };
    const prisma = { visitor: { findUnique: jest.fn(async () => ({ id: 'v' })) } };
    const photos = { attach: jest.fn(async (rows: unknown[]) => rows) };
    const controller = new FollowUpPipelineController(pipeline as never, scoped as never, prisma as never, photos as never, {} as never);
    return { controller, pipeline };
  };

  it('lists only their own, whatever they ask for', async () => {
    const { controller, pipeline } = setup();
    await controller.people(actor(), { assigneeId: 'ruth' });
    expect(pipeline.list).toHaveBeenCalledWith(expect.objectContaining({ assigneeId: 'me' }));
    await controller.year(actor(), 2026);
    expect(pipeline.year).toHaveBeenCalledWith(2026, expect.any(Date), 'me');
    await controller.breakdowns(actor(), 2026, 11);
    expect(pipeline.breakdowns).toHaveBeenCalledWith(expect.objectContaining({ assigneeId: 'me' }));
  });

  it("opens their own first-timer's profile, and refuses anyone else's", async () => {
    const { controller } = setup();
    await expect(controller.person(actor(), 'mine')).resolves.toBeTruthy();
    await expect(controller.person(actor(), 'theirs')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.answers(actor(), 'theirs')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
