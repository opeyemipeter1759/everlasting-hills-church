import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EvangelismAccessService } from './services/evangelism-access.service';
import { EvangelismContactsService } from './services/evangelism-contacts.service';
import { EvangelismTasksService } from './services/evangelism-tasks.service';
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
  const svc = new EvangelismContactsService(prisma as never, access as never);
  jest.spyOn(svc, 'get').mockResolvedValue({} as never);
  return { svc, create, update, activity, prisma };
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

const viewer: EvangelismViewer = { unitId: 'unit-ev', departmentId: 'dept-go', canLead: false, memberId: 'm1', name: 'Ada Obi' };

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
