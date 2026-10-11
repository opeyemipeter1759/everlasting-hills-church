import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EvangelismAccessService } from './services/evangelism-access.service';
import { EvangelismContactsService } from './services/evangelism-contacts.service';
import { EvangelismTasksService } from './services/evangelism-tasks.service';
import { EvangelismNotesService } from './services/evangelism-notes.service';
import { EvangelismFormController } from './evangelism-form.controller';
import type { EvangelismViewer } from './evangelism.types';

const config = { get: () => 'tenant' } as never;
const UNIT = { id: 'unit-ev', name: 'Evangelism Team', departmentId: 'dept-go' };

const user = (over: Record<string, unknown> = {}) =>
  ({
    userId: 'u1',
    email: 'ada@x.test',
    role: Role.MEMBER,
    effectiveRoles: [Role.MEMBER],
    unitLeadOf: [],
    hodOf: [],
    headUsher: false,
    profileId: 'p1',
    memberId: 'm1',
    ...over,
  }) as never;

function accessWith(seat: { isLead?: boolean; isAssistant?: boolean } | null) {
  const prisma = {
    unit: { findMany: jest.fn().mockResolvedValue([{ id: 'x', name: 'Outreach Team', departmentId: 'dept-go' }, UNIT]) },
    unitMember: { findFirst: jest.fn().mockResolvedValue(seat ? { isLead: false, isAssistant: false, ...seat } : null) },
    member: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Ada', lastName: 'Obi' }) },
  };
  return new EvangelismAccessService(prisma as never, config);
}

describe('Who can use Evangelism', () => {
  it('lets anyone on the Evangelism unit in, without leading it', async () => {
    await expect(accessWith({}).viewer(user())).resolves.toMatchObject({ unitId: 'unit-ev', canLead: false, name: 'Ada Obi' });
  });

  it("keeps out a member who isn't on the team", async () => {
    await expect(accessWith(null).viewer(user())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('gives the unit lead or assistant, the Growth & Outreach head and church admins full control', async () => {
    await expect(accessWith({ isAssistant: true }).viewer(user())).resolves.toMatchObject({ canLead: true });
    await expect(accessWith(null).viewer(user({ unitLeadOf: ['unit-ev'] }))).resolves.toMatchObject({ canLead: true });
    await expect(accessWith(null).viewer(user({ hodOf: ['dept-go'] }))).resolves.toMatchObject({ canLead: true });
    await expect(accessWith(null).viewer(user({ effectiveRoles: [Role.ADMIN] }))).resolves.toMatchObject({ canLead: true });
  });

  it('leaves leader-only actions to leaders', async () => {
    await expect(accessWith({}).leader(user())).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function contactsService(existing: Record<string, unknown> | null = null) {
  const create = jest.fn().mockResolvedValue({});
  const update = jest.fn().mockResolvedValue({});
  const activity = jest.fn().mockResolvedValue({});
  const prisma = {
    $transaction: jest.fn(async (ops: unknown[]) => ops),
    evangelismContact: { create, update, findFirst: jest.fn().mockResolvedValue(existing) },
    evangelismActivity: { create: activity },
    evangelismOutreach: { findFirst: jest.fn().mockResolvedValue({ id: 'o1' }) },
    unitMember: {
      findFirst: jest.fn().mockResolvedValue({ Member: { id: 'm2', firstName: 'Bola', lastName: 'Ade' } }),
    },
    member: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const access = { tenant: 'tenant', names: jest.fn().mockResolvedValue(new Map()) };
  const inbox = { createMany: jest.fn() };
  const events = { emit: jest.fn() };
  const svc = new EvangelismContactsService(prisma as never, { ...access, appUrl: 'https://x.test' } as never, inbox as never, events as never);
  jest.spyOn(svc, 'get').mockResolvedValue({} as never);
  return { svc, create, update, activity, prisma, inbox, events };
}

const form = {
  name: 'Chinedu Okeke',
  phone: '0803 123 4567',
  address: '12 Adeola St',
  savedStatus: 'YES' as const,
  isStudent: false,
  workerMemberId: 'm2',
  consent: true,
};

describe('Recording someone preached to', () => {
  it("stores the phone in +234 form, credits the worker and starts a 30-day window", async () => {
    const { svc, create, activity } = contactsService();
    await svc.create('unit-ev', form, { memberId: null, name: 'Outreach form' }, 'FORM');
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ phone: '+2348031234567', workerMemberId: 'm2', workerName: 'Bola Ade', status: 'NEW', source: 'FORM' });
    expect((data.windowEndsAt.getTime() - data.contactDate.getTime()) / 86_400_000).toBe(30);
    expect(activity.mock.calls[0][0].data).toMatchObject({ kind: 'CREATED', actorName: 'Bola Ade' });
  });

  it('refuses a number that is not Nigerian, and a student without a school', async () => {
    const { svc } = contactsService();
    await expect(svc.create('unit-ev', { ...form, phone: '+44 7700 900123' }, { memberId: null, name: 'x' }, 'FORM')).rejects.toThrow(
      'Nigerian phone number',
    );
    await expect(svc.create('unit-ev', { ...form, isStudent: true }, { memberId: null, name: 'x' }, 'FORM')).rejects.toThrow('school');
  });

  it('takes a typed-in name under "Other"', async () => {
    const { svc, create, prisma } = contactsService();
    prisma.unitMember.findFirst.mockResolvedValue(null);
    await svc.create('unit-ev', { ...form, workerMemberId: undefined, workerName: 'Pastor Tope' } as never, { memberId: null, name: 'x' }, 'FORM');
    expect(create.mock.calls[0][0].data).toMatchObject({ workerMemberId: null, workerName: 'Pastor Tope' });
  });

  it('keeps nothing a bot sends through the honeypot', async () => {
    const contacts = { create: jest.fn() };
    const ctrl = new EvangelismFormController({ findUnit: jest.fn() } as never, contacts as never, {} as never);
    await expect(ctrl.submit({ ...form, website: 'http://spam.test' })).resolves.toEqual({ ok: true });
    expect(contacts.create).not.toHaveBeenCalled();
  });
});

const viewer: EvangelismViewer = { unitId: 'unit-ev', departmentId: 'dept-go', canLead: false, memberId: 'm1', profileId: 'p1', name: 'Ada Obi' };

describe('Logging a follow-up', () => {
  const current = { id: 'c1', status: 'NEW', lastActionAt: null, invitedAt: null, attendedAt: null };

  it('records who did it, moves the status on and resets the 3-day clock', async () => {
    const { svc, update, activity } = contactsService(current);
    await svc.logAction(viewer, 'c1', { kind: 'CALL', outcome: 'Reached', status: 'INVITED' });
    expect(update.mock.calls[0][0].data).toMatchObject({ status: 'INVITED', lastActionAt: expect.any(Date), invitedAt: expect.any(Date) });
    expect(activity.mock.calls[0][0].data).toMatchObject({
      kind: 'CALL',
      statusFrom: 'NEW',
      statusTo: 'INVITED',
      actorMemberId: 'm1',
      actorName: 'Ada Obi',
    });
  });

  it('needs a date for a call-back', async () => {
    const { svc } = contactsService(current);
    await expect(svc.logAction(viewer, 'c1', { kind: 'CALL', status: 'CALL_BACK' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('counts attending church as having been invited too', async () => {
    const { svc, update } = contactsService(current);
    await svc.logAction(viewer, 'c1', { status: 'ATTENDED' });
    expect(update.mock.calls[0][0].data).toMatchObject({ invitedAt: expect.any(Date), attendedAt: expect.any(Date) });
  });
});

describe('Evangelism tasks', () => {
  function tasks(assignees: string[]) {
    const task = { id: 't1', title: 'Call Chinedu', type: 'CALL', status: 'PENDING', completedAt: null, dueAt: null, createdById: 'lead',
      createdAt: new Date(), description: null, priority: 'MEDIUM', Assignees: assignees.map((memberId) => ({ memberId })), Notes: [], Contact: null };
    const prisma = {
      evangelismTask: { findFirst: jest.fn().mockResolvedValue(task), update: jest.fn().mockResolvedValue(task) },
      evangelismTaskNote: { create: jest.fn() },
    };
    const access = { tenant: 'tenant', names: jest.fn().mockResolvedValue(new Map()) };
    return {
      svc: new EvangelismTasksService(prisma as never, access as never, {} as never, {} as never, { get: () => undefined } as never),
      prisma,
    };
  }

  it('lets the person given a task move its status', async () => {
    const { svc, prisma } = tasks(['m1']);
    await svc.update(viewer, 't1', { status: 'DONE' });
    expect(prisma.evangelismTask.update.mock.calls[0][0].data).toMatchObject({ status: 'DONE', completedAt: expect.any(Date) });
  });

  it("stops a member changing anything else, or someone else's task", async () => {
    await expect(tasks(['m1']).svc.update(viewer, 't1', { title: 'New' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(tasks(['m9']).svc.update(viewer, 't1', { status: 'DONE' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(tasks(['m9']).svc.addNote(viewer, 't1', { body: 'hi' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('only shows every task to leaders', async () => {
    await expect(tasks([]).svc.list(viewer, { scope: 'all' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('Assigning someone to follow a contact up', () => {
  const leader: EvangelismViewer = { ...viewer, canLead: true, memberId: 'lead', name: 'Bola Ade' };

  function withContact(seat: unknown = { Member: { firstName: 'Grace', lastName: 'Eze' } }) {
    const t = contactsService({ id: 'c1', name: 'Chinedu', assigneeMemberId: null, workerName: 'Tunde' });
    t.prisma.unitMember.findFirst.mockResolvedValue(seat);
    (t.prisma.member as Record<string, jest.Mock>).findUnique = jest.fn().mockResolvedValue({ profileId: 'p-grace', email: 'g@x.test', firstName: 'Grace' });
    return t;
  }

  it('records it on their history and tells the person, in the app and by email', async () => {
    const { svc, update, activity, inbox, events } = withContact();
    await svc.assign(leader, 'c1', 'm-grace');
    expect(update.mock.calls[0][0].data).toMatchObject({ assigneeMemberId: 'm-grace' });
    expect(activity.mock.calls[0][0].data).toMatchObject({ note: 'Assigned to Grace Eze', actorName: 'Bola Ade' });
    expect(inbox.createMany.mock.calls[0][0][0]).toMatchObject({
      profileId: 'p-grace',
      title: "You've been asked to follow up Chinedu",
      link: '/dashboard/growth-outreach/unit-ev?contact=c1',
    });
    expect(events.emit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ to: 'g@x.test', subject: 'Please follow up Chinedu' }));
  });

  it('only to people on the Evangelism Team', async () => {
    await expect(withContact(null).svc.assign(leader, 'c1', 'outsider')).rejects.toThrow('Evangelism Team');
  });

  it('can hand them back to the worker who preached', async () => {
    const t = contactsService({ id: 'c1', name: 'Chinedu', assigneeMemberId: 'm-grace', workerName: 'Tunde' });
    await t.svc.assign(leader, 'c1', null);
    expect(t.update.mock.calls[0][0].data).toMatchObject({ assigneeMemberId: null });
    expect(t.activity.mock.calls[0][0].data.note).toBe('Handed back to Tunde, who preached to them');
    expect(t.inbox.createMany).not.toHaveBeenCalled();
  });
});

describe('Feedback on a contact', () => {
  function notesService(note: Record<string, unknown> | null = { id: 'n1', subjectId: 'c1', authorId: 'p-other' }) {
    const prisma = {
      evangelismContact: { findFirst: jest.fn().mockResolvedValue({ id: 'c1', name: 'Chinedu', workerMemberId: 'm1', assigneeMemberId: null }) },
      followUpNote: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(note),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
        delete: jest.fn(),
      },
      followUpNoteRead: { upsert: jest.fn() },
      member: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
      notification: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const access = { tenant: 'tenant', appUrl: 'https://x.test' };
    const svc = new EvangelismNotesService(prisma as never, access as never, { createMany: jest.fn() } as never, { emit: jest.fn() } as never);
    return { svc, prisma };
  }

  it('keeps it in its own thread, apart from Follow Up', async () => {
    const { svc, prisma } = notesService();
    await svc.add(viewer, 'c1', 'Called him, he will come Sunday');
    expect(prisma.followUpNote.create.mock.calls[0][0].data).toMatchObject({ subjectKind: 'EVANGELISM', subjectId: 'c1', authorId: 'p1' });
    expect(prisma.followUpNote.findFirst).not.toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ subjectKind: 'MEMBER' }) }));
  });

  it("won't let you edit someone else's message, or delete it unless you lead", async () => {
    const { svc } = notesService();
    await expect(svc.edit(viewer, 'n1', 'x')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.remove(viewer, 'n1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.remove({ ...viewer, canLead: true }, 'n1')).resolves.toEqual([]);
  });

  it("can't reach Follow Up's notes by id", async () => {
    const { svc, prisma } = notesService(null);
    await expect(svc.react(viewer, 'follow-up-note', '🙏')).rejects.toThrow('Message not found');
    expect(prisma.followUpNote.findFirst.mock.calls[0][0].where).toMatchObject({ subjectKind: 'EVANGELISM' });
  });
});

describe('Any member can be the worker on the public form', () => {
  function searchWith(rows: { id: string; firstName: string; lastName: string }[] = []) {
    const findMany = jest.fn().mockResolvedValue(rows);
    const svc = new EvangelismAccessService({ member: { findMany } } as never, config);
    return { svc, findMany };
  }

  it('answers nothing until two letters are typed, so the roll is never listed', async () => {
    const { svc, findMany } = searchWith();
    await expect(svc.searchMembers('')).resolves.toEqual([]);
    await expect(svc.searchMembers(' a ')).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('finds active members by first or last name, names only, ten at most', async () => {
    const { svc, findMany } = searchWith([{ id: 'm9', firstName: 'Olamide', lastName: 'Ajayi' }]);
    await expect(svc.searchMembers('ola aj')).resolves.toEqual([{ id: 'm9', name: 'Olamide Ajayi' }]);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toMatchObject({ tenantId: 'tenant', status: 'ACTIVE' });
    expect(args.where.AND).toHaveLength(2);
    expect(args.select).toEqual({ id: true, firstName: true, lastName: true });
    expect(args.take).toBe(10);
  });
});

describe("A member's evangelism tally", () => {
  it('counts everyone they preached to, those saved, and this year', async () => {
    const groupBy = jest
      .fn()
      .mockResolvedValueOnce([
        { savedStatus: 'YES', _count: { _all: 12 } },
        { savedStatus: 'NO', _count: { _all: 33 } },
        { savedStatus: 'ALREADY', _count: { _all: 3 } },
        { savedStatus: 'REDEDICATED', _count: { _all: 5 } },
      ])
      .mockResolvedValueOnce([
        { savedStatus: 'YES', _count: { _all: 9 } },
        { savedStatus: 'NO', _count: { _all: 22 } },
      ]);
    const last = new Date('2026-10-04T10:00:00Z');
    const prisma = { evangelismContact: { groupBy, findFirst: jest.fn().mockResolvedValue({ contactDate: last }) } };
    const svc = new EvangelismAccessService(prisma as never, config);
    await expect(svc.tally('m1')).resolves.toEqual({
      reached: 53,
      saved: 12,
      rededicated: 5,
      alreadySaved: 3,
      thisYear: { reached: 31, saved: 9 },
      lastContactDate: last,
    });
    expect(groupBy.mock.calls[0][0].where).toEqual({ tenantId: 'tenant', workerMemberId: 'm1' });
  });
});
