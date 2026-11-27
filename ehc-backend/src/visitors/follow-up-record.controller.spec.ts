import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpRecordController } from './follow-up-record.controller';

const actor = (o: Partial<AuthUser> = {}): AuthUser =>
  ({ userId: 'u', profileId: 'p', memberId: 'me', effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], ...o }) as AuthUser;

function setup(o: { lead?: boolean; scope?: string | null } = {}) {
  const visitors = {
    getById: jest.fn(async (id: string) => ({ id, firstName: 'Ada', prayerPoint: 'private' })),
    update: jest.fn(async (id: string, edit: Record<string, unknown>) => ({ id, ...edit, prayerPoint: 'private' })),
  };
  const pipeline = { one: jest.fn(async (id: string) => ({ visitorId: id, assigneeId: id === 'mine' ? 'me' : 'ruth' })) };
  const auth = {
    requireAccess: jest.fn(),
    firstTimerScope: jest.fn(async () => (o.scope === undefined ? 'me' : o.scope)),
    canEditRecord: jest.fn(async (a: AuthUser, assigneeId: string | null) => !!o.lead || assigneeId === a.memberId),
  };
  return { controller: new FollowUpRecordController(visitors as never, pipeline as never, auth as never), visitors };
}

describe("a first-timer's record from their Follow-Up profile", () => {
  it('lets a team member read and correct the first-timers assigned to them, never the prayer request', async () => {
    const { controller, visitors } = setup();
    const read = await controller.record(actor(), 'mine');
    expect(read).toMatchObject({ canEdit: true });
    expect(JSON.stringify(read)).not.toContain('private');
    const saved = await controller.update(actor(), 'mine', { firstName: 'Adaeze', prayerPoint: 'rewritten' } as never);
    expect(visitors.update).toHaveBeenCalledWith('mine', { firstName: 'Adaeze' });
    expect(JSON.stringify(saved)).not.toContain('private');
  });

  it("refuses a team member someone else's first-timer", async () => {
    const { controller, visitors } = setup();
    await expect(controller.record(actor(), 'theirs')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.update(actor(), 'theirs', { firstName: 'X' } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(visitors.update).not.toHaveBeenCalled();
  });

  it('lets the lead edit anyone, and shows others who see everyone a read-only record', async () => {
    const lead = setup({ lead: true, scope: null });
    await lead.controller.update(actor(), 'theirs', { firstName: 'X' } as never);
    expect(lead.visitors.update).toHaveBeenCalled();
    const viewer = setup({ scope: null });
    expect(await viewer.controller.record(actor(), 'theirs')).toMatchObject({ canEdit: false });
    await expect(viewer.controller.update(actor(), 'theirs', { firstName: 'X' } as never)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
