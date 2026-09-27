import { ForbiddenException } from '@nestjs/common';
import { FollowUpIntakeService } from './follow-up-intake.service';
import { FollowUpMasterListService } from './follow-up-master-list.service';
import { FollowUpProgressService } from './follow-up-progress.service';
import { contactLogBody, mirrorLogToThread } from './contact-log-note.util';

const config = { get: () => 'tenant' } as never;
const actor = { userId: 'u1', memberId: 'lead', profileId: 'p-lead' } as never;

describe('Integration Team assignment is its own', () => {
  function intake({ leadsIntegration = true, onTeam = true } = {}) {
    const update = jest.fn(async ({ data }) => ({ id: 'e1', ...data }));
    const prisma = {
      followUpEntry: {
        findFirst: jest.fn().mockResolvedValue({ id: 'e1', unitId: 'unit-fu', assigneeId: 'fu-worker', integrationAssigneeId: null, stage: 'IN_PROGRESS' }),
        update,
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      unit: { findMany: jest.fn().mockResolvedValue([{ id: 'unit-int', name: 'Integration Team', departmentId: null }]) },
      unitMember: { findFirst: jest.fn().mockResolvedValue(onTeam ? { id: 'um1' } : null) },
    };
    const auth = { canLeadUnit: jest.fn().mockResolvedValue(leadsIntegration) };
    const mapper = { mapEntry: jest.fn(() => ({ person: { name: 'Tunde Bello' } })) };
    const notify = { notifyAssigned: jest.fn() };
    const svc = new FollowUpIntakeService(
      prisma as never, auth as never, mapper as never, { write: jest.fn() } as never,
      {} as never, notify as never, {} as never, { isSuperAdmin: jest.fn().mockResolvedValue(false) } as never, config,
    );
    return { svc, prisma, update, notify, auth };
  }

  it("sets only the Integration Team's assignee, leaving Follow Up's assignee, unit and stage alone", async () => {
    const { svc, update, notify } = intake();
    await svc.assign(actor, 'e1', { assigneeId: 'int-worker', team: 'INTEGRATION' });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { integrationAssigneeId: 'int-worker' } }));
    expect(notify.notifyAssigned).toHaveBeenCalledWith('int-worker', 'Tunde Bello', 'e1');
  });

  it('is for the Integration Team lead, and only to people on their team', async () => {
    await expect(intake({ leadsIntegration: false }).svc.assign(actor, 'e1', { assigneeId: 'x', team: 'INTEGRATION' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(intake({ onTeam: false }).svc.assign(actor, 'e1', { assigneeId: 'x', team: 'INTEGRATION' })).rejects.toThrow(
      'must be on the Integration Team',
    );
  });

  it("bulk-reassigning within the Integration Team moves only its own assignments", async () => {
    const { svc, prisma } = intake();
    prisma.unitMember.findFirst.mockResolvedValue({ id: 'um' });
    await expect(svc.bulkReassign(actor, { unitId: 'unit-int', fromAssigneeId: 'a', toAssigneeId: 'b' })).resolves.toEqual({ reassigned: 2 });
    expect(prisma.followUpEntry.updateMany.mock.calls[0][0]).toMatchObject({
      where: { integrationAssigneeId: 'a' },
      data: { integrationAssigneeId: 'b' },
    });
  });
});

describe("Each board's Master List uses its own assignee", () => {
  const row = (id: string, fu: string | null, int: string | null) => ({
    id,
    kind: 'MEMBER' as const,
    name: id,
    photoUrl: null,
    assignedTo: fu ? { id: fu, name: fu } : null,
    integrationAssignedTo: int ? { id: int, name: int } : null,
    status: 'INTEGRATED' as const,
    statusAwaitingApproval: null,
    hasAccount: true,
    attended: 3,
    since: '2026-01-01T00:00:00.000Z',
    latestEntryAt: null,
  });

  function list() {
    const roll = { everyone: jest.fn().mockResolvedValue([row('ada', 'fu-worker', 'int-worker'), row('tunde', 'fu-worker', null)]) };
    const prisma = { service: { findMany: jest.fn().mockResolvedValue([]) }, attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) } };
    const activity = { forRows: jest.fn().mockResolvedValue(new Map()) };
    return new FollowUpMasterListService(roll as never, prisma as never, activity as never, config);
  }

  it("shows and filters by the Integration Team's assignee on their list", async () => {
    const page = await list().list({ scope: 'INTEGRATION', assigneeId: 'int-worker', take: 50, skip: 0 });
    expect(page.data.map((r) => [r.id, r.assignedTo?.id])).toEqual([['ada', 'int-worker']]);
  });

  it("never lists Follow Up's assignments under the Integration Team's Assigned to me", async () => {
    const page = await list().list({ scope: 'INTEGRATION', assigneeId: 'fu-worker', take: 50, skip: 0 });
    expect(page.data).toEqual([]);
  });
});

describe('Logged contacts on the activity thread', () => {
  it('reads as what was done and how it went, then the note', () => {
    expect(
      contactLogBody({ kind: 'CONTACT', method: 'CALL', outcome: 'NO_ANSWER', note: ' Tried twice ', isPastoralContact: true }),
    ).toBe("📞 Call · No answer · Pastor's call\nTried twice");
    expect(contactLogBody({ kind: 'QUICK_UPDATE', method: null, outcome: null, note: 'Moved to Lagos', isPastoralContact: false })).toBe(
      'Moved to Lagos',
    );
    expect(contactLogBody({ kind: 'CONNECTION', method: null, outcome: null, note: 'Introduced to Ada', isPastoralContact: false })).toBe(
      '🤝 Introduced to Ada',
    );
  });

  it('goes on the right thread, once, however many times it is mirrored', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = { followUpNote: { upsert } } as never;
    const thread = await mirrorLogToThread(prisma, {
      tenantId: 't',
      logId: 'L1',
      entry: { memberId: null, visitorId: 'v1' },
      authorProfileId: 'p1',
      body: 'hi',
    });
    expect(thread).toEqual({ subjectKind: 'VISITOR', subjectId: 'v1' });
    expect(upsert.mock.calls[0][0]).toMatchObject({ where: { id: 'log-L1' }, update: {} });
  });
});

describe('Logging a contact', () => {
  function progress(isPrivate: boolean) {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      followUpEntry: {
        findFirst: jest.fn().mockResolvedValue({ id: 'e1', unitId: 'u', assigneeId: 'lead', memberId: 'm1', visitorId: null, stage: 'IN_PROGRESS' }),
        update: jest.fn().mockResolvedValue({ id: 'e1' }),
      },
      followUpContactLog: {
        create: jest.fn(async ({ data }) => ({ ...data, isPastoralContact: false })),
      },
      followUpNote: { upsert },
    };
    const alerts = { onNewMessage: jest.fn() };
    const svc = new FollowUpProgressService(
      prisma as never,
      { canWorkEntry: jest.fn().mockResolvedValue(true) } as never,
      { mapEntry: jest.fn(() => ({})) } as never,
      { write: jest.fn() } as never,
      {} as never,
      alerts as never,
      config,
    );
    return { svc, upsert, alerts, isPrivate };
  }

  it("puts it on the person's thread and tells the people following them", async () => {
    const { svc, upsert, alerts } = progress(false);
    await svc.logContact(actor, 'e1', { method: 'CALL', outcome: 'REACHED', note: 'Coming Sunday', isPrivate: false });
    expect(upsert.mock.calls[0][0].create).toMatchObject({ subjectKind: 'MEMBER', subjectId: 'm1', body: '📞 Call · Reached\nComing Sunday' });
    expect(alerts.onNewMessage).toHaveBeenCalledWith('p-lead', 'MEMBER', 'm1', '📞 Call · Reached\nComing Sunday');
  });

  it('keeps a contact marked private off the shared thread', async () => {
    const { svc, upsert, alerts } = progress(true);
    await svc.logContact(actor, 'e1', { method: 'CALL', outcome: 'REACHED', note: 'Sensitive', isPrivate: true });
    expect(upsert).not.toHaveBeenCalled();
    expect(alerts.onNewMessage).not.toHaveBeenCalled();
  });
});
