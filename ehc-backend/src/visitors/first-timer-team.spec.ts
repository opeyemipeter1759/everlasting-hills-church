import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { FirstTimerTeamAccess, isFirstTimerTeamUnitName, withoutPrayer } from './first-timer-team.access';
import { FirstTimerTeamController } from './first-timer-team.controller';

const TEAM = { id: 'u-team', name: 'First Timer Team', departmentId: 'd-ma' };

function access(o: { members?: string[]; heads?: string[] } = {}) {
  const prisma = {
    unit: { findMany: jest.fn().mockResolvedValue([TEAM, { id: 'u-other', name: 'First Aid', departmentId: 'd-x' }]) },
    unitMember: { findFirst: jest.fn(async ({ where }) => ((o.members ?? []).includes(where.memberId) ? { id: 'um' } : null)) },
    departmentHead: { findFirst: jest.fn(async ({ where }) => ((o.heads ?? []).includes(where.userId) ? { id: 'dh' } : null)) },
  };
  return new FirstTimerTeamAccess(prisma as never, { get: () => 't1' } as never);
}

const actor = (o: Partial<AuthUser> = {}): AuthUser =>
  ({ userId: 'u', profileId: 'p', memberId: 'm', effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], ...o }) as AuthUser;

describe('the First Timer Team view', () => {
  it('knows the team by name, however it was typed', () => {
    expect(isFirstTimerTeamUnitName('First Timer Team')).toBe(true);
    expect(isFirstTimerTeamUnitName('first-timers')).toBe(true);
    expect(isFirstTimerTeamUnitName('Follow-Up')).toBe(false);
  });

  it('lets in the team, its lead, the department head and admins; nobody else', async () => {
    expect(await access({ members: ['m'] }).allowed(actor())).toBe(true);
    expect(await access().allowed(actor({ unitLeadOf: ['u-team'] }))).toBe(true);
    expect(await access({ heads: ['p'] }).allowed(actor())).toBe(true);
    expect(await access().allowed(actor({ effectiveRoles: [Role.MEMBER, Role.ADMIN_HEAD] }))).toBe(true);
    expect(await access().allowed(actor())).toBe(false);
    expect(await access().allowed(actor({ unitLeadOf: ['u-other'] }))).toBe(false);
    await expect(access().require(actor())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('never sends the prayer request, and never edits it', async () => {
    expect(withoutPrayer({ id: 'v1', firstName: 'Ada', prayerPoint: 'private' })).toEqual({ id: 'v1', firstName: 'Ada' });

    const visitors = {
      firstTimers: jest.fn().mockResolvedValue({ rows: [{ id: 'v1', firstName: 'Ada', prayerPoint: 'private' }], total: 1, counts: {} }),
      update: jest.fn(async (_id: string, edit: Record<string, unknown>) => ({ id: 'v1', ...edit, prayerPoint: 'private' })),
    };
    const pipeline = { list: jest.fn().mockResolvedValue({ counts: { all: 1 } }) };
    const controller = new FirstTimerTeamController(visitors as never, pipeline as never, access({ members: ['m'] }));
    const page = await controller.list(actor(), {});
    expect(JSON.stringify(page)).not.toContain('private');

    const lead = actor({ unitLeadOf: ['u-team'] });
    const saved = await controller.update(lead, 'v1', { firstName: 'Adaeze', prayerPoint: 'rewritten' } as never);
    expect(visitors.update).toHaveBeenCalledWith('v1', { firstName: 'Adaeze' });
    expect(JSON.stringify(saved)).not.toContain('private');
  });

  it('lets only the lead, the department head and admins edit; the rest of the team reads', async () => {
    expect(await access({ members: ['m'] }).canEdit(actor())).toBe(false);
    expect(await access().canEdit(actor({ unitLeadOf: ['u-team'] }))).toBe(true);
    expect(await access({ heads: ['p'] }).canEdit(actor())).toBe(true);
    expect(await access().canEdit(actor({ effectiveRoles: [Role.MEMBER, Role.ADMIN_HEAD] }))).toBe(true);
    expect(await access().canEdit(actor({ unitLeadOf: ['u-other'] }))).toBe(false);

    const visitors = {
      firstTimers: jest.fn().mockResolvedValue({ rows: [], total: 0, counts: {} }),
      update: jest.fn(),
    };
    const pipeline = { list: jest.fn().mockResolvedValue({ counts: { all: 0 } }) };
    const controller = new FirstTimerTeamController(visitors as never, pipeline as never, access({ members: ['m'] }));
    expect(await controller.list(actor(), {})).toMatchObject({ canEdit: false });
    await expect(controller.update(actor(), 'v1', { firstName: 'Adaeze' } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(visitors.update).not.toHaveBeenCalled();
  });
});
