import { BadRequestException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { OneOnOneRequestsService } from './one-on-one-requests.service';

const START = '2026-11-12T12:00:00.000Z';
const END = '2026-11-12T13:00:00.000Z';

const member: AuthUser = {
  userId: 'u1',
  email: 'ada@x.com',
  role: Role.MEMBER,
  effectiveRoles: [Role.MEMBER],
  unitLeadOf: [],
  hodOf: [],
  headUsher: false,
  profileId: 'member-1',
  memberId: 'm1',
  tenantId: 't1',
};
const pastor: AuthUser = { ...member, userId: 'u2', profileId: 'pastor-faith', effectiveRoles: [Role.MEMBER, Role.PASTOR] };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    hostId: 'h1',
    coHostId: null,
    sessionTypeId: 'st1',
    memberProfileId: 'member-1',
    requesterType: 'MEMBER',
    requesterName: 'Ada Obi',
    requesterEmail: 'ada@x.com',
    requesterPhone: null,
    requesterLocation: null,
    foundVia: null,
    startsAt: new Date(START),
    endsAt: new Date(END),
    proposedStartsAt: null,
    proposedEndsAt: null,
    status: 'PENDING',
    format: 'IN_PERSON',
    topic: 'Counsel',
    noteEncrypted: 'enc:secret',
    decisionNote: null,
    meetLink: null,
    cancelledBy: null,
    createdAt: new Date('2026-11-02T10:00:00.000Z'),
    Host: { displayName: 'Pastor Faith', profileId: 'pastor-faith', defaultMeetingLink: 'https://zoom.us/j/standing' },
    googleEventId: null,
    requesterTimezone: null,
    CoHost: null,
    SessionType: { name: 'Counsel & prayer', durationMinutes: 60 },
    ...overrides,
  };
}

function setup(opts: { cipherOn?: boolean; open?: boolean; slots?: string[] } = {}) {
  const prisma = {
    pastoralBooking: {
      findFirst: jest.fn().mockResolvedValue(opts.open ? row() : null),
      findMany: jest.fn().mockResolvedValue([]),
      findUniqueOrThrow: jest.fn().mockResolvedValue(row()),
      create: jest.fn(),
      update: jest.fn(({ data }) => Promise.resolve(row(data))),
    },
    pastorSessionType: { findFirst: jest.fn().mockResolvedValue({ id: 'st1', hostId: 'h1', jointWithHostId: null, askTopic: true }) },
    member: { findFirst: jest.fn().mockResolvedValue({ firstName: 'Ada', lastName: 'Obi', email: 'ada@x.com', phone: null }) },
    visitor: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  const slots = (opts.slots ?? [START]).map((s) => ({ startsAt: s, endsAt: new Date(new Date(s).getTime() + 3_600_000).toISOString() }));
  const oneOnOne = {
    computeOpenSlots: jest.fn().mockResolvedValue([{ date: '2026-11-12', slots }]),
    externalBusyFor: jest.fn().mockResolvedValue([]),
    assertCanManage: jest.fn().mockResolvedValue({ host: { id: 'h1' }, isOwner: true }),
  };
  const notify = { toRequester: jest.fn(), toHostSide: jest.fn() };
  const cipher = { isConfigured: opts.cipherOn ?? true, encrypt: (s: string) => `enc:${s}`, decrypt: (s: string) => s.replace('enc:', '') };
  const calendar = {
    createEvent: jest.fn().mockResolvedValue({ eventId: 'g1', meetLink: 'https://meet.google.com/auto' }),
    deleteEvent: jest.fn().mockResolvedValue(undefined),
  };
  const links = { bookingIdFrom: (t: string) => (t === 'good.sig' ? 'b1' : null) };
  const ics = {};
  const svc = new OneOnOneRequestsService(
    prisma as never,
    oneOnOne as never,
    notify as never,
    cipher as never,
    calendar as never,
    links as never,
    ics as never,
    { get: () => 't1' } as never,
  );
  return { svc, prisma, oneOnOne, notify, calendar };
}

const dto = { hostId: 'h1', sessionTypeId: 'st1', startsAt: START, format: 'IN_PERSON' as const, topic: 'Counsel' as const, note: 'Private' };

describe('createMemberRequest', () => {
  it('holds the time as PENDING, encrypts the note, and tells both sides', async () => {
    const { svc, prisma, notify } = setup();
    await svc.createMemberRequest(member, dto);
    const data = prisma.pastoralBooking.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ status: 'PENDING', memberProfileId: 'member-1', noteEncrypted: 'enc:Private', endsAt: new Date(END) });
    expect(notify.toRequester).toHaveBeenCalledWith(expect.anything(), 'RECEIVED');
    expect(notify.toHostSide).toHaveBeenCalledWith(expect.anything(), 'NEW');
  });

  it('refuses a time that is no longer open', async () => {
    const { svc, prisma } = setup({ slots: ['2026-11-12T13:30:00.000Z'] });
    await expect(svc.createMemberRequest(member, dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.pastoralBooking.create).not.toHaveBeenCalled();
  });

  it('lets a member hold several sessions, but not two at the same time', async () => {
    const clashing = setup({ open: true });
    await expect(clashing.svc.createMemberRequest(member, dto)).rejects.toThrow(/already have a session requested at that time/);

    const free = setup();
    await free.svc.createMemberRequest(member, dto);
    const where = free.prisma.pastoralBooking.findFirst.mock.calls[0][0].where;
    expect(where).toMatchObject({ memberProfileId: 'member-1', endsAt: { gt: new Date(START) } });
    expect(free.prisma.pastoralBooking.create).toHaveBeenCalled();
  });

  it('never stores a note in plain text when encryption is off', async () => {
    const { svc } = setup({ cipherOn: false });
    await expect(svc.createMemberRequest(member, dto)).rejects.toBeInstanceOf(BadRequestException);
    const { svc: svc2, prisma } = setup({ cipherOn: false });
    await svc2.createMemberRequest(member, { ...dto, note: undefined });
    expect(prisma.pastoralBooking.create.mock.calls[0][0].data.noteEncrypted).toBeNull();
  });
});

describe('member changes', () => {
  it('lets a member withdraw a pending request', async () => {
    const { svc, prisma, notify } = setup({ open: true });
    await svc.cancelMine(member, 'b1', { note: 'Something came up at work' });
    expect(prisma.pastoralBooking.update.mock.calls[0][0].data).toMatchObject({ status: 'CANCELLED', cancelledBy: 'REQUESTER' });
    expect(notify.toHostSide).toHaveBeenCalledWith(expect.anything(), 'WITHDRAWN', 'Something came up at work');
  });

  it('stops self-cancelling an approved session inside 24 hours', async () => {
    const { svc, prisma } = setup();
    const soon = new Date(Date.now() + 3 * 3_600_000);
    prisma.pastoralBooking.findFirst.mockResolvedValue(row({ status: 'APPROVED', startsAt: soon }));
    await expect(svc.cancelMine(member, 'b1', { note: 'Travelling' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('books the suggested time when the member accepts it', async () => {
    const { svc, prisma } = setup();
    const proposedStartsAt = new Date(Date.now() + 5 * 24 * 3_600_000);
    const proposedEndsAt = new Date(proposedStartsAt.getTime() + 3_600_000);
    prisma.pastoralBooking.findFirst.mockResolvedValue(row({ status: 'PROPOSED', proposedStartsAt, proposedEndsAt }));
    await svc.acceptProposal(member, 'b1');
    expect(prisma.pastoralBooking.update.mock.calls[0][0].data).toMatchObject({
      status: 'APPROVED',
      startsAt: proposedStartsAt,
      endsAt: proposedEndsAt,
      proposedStartsAt: null,
    });
  });
});

describe('pastor decisions', () => {
  it('suggests another time, checking it while ignoring the request’s own slot', async () => {
    const later = '2026-11-12T14:00:00.000Z';
    const { svc, prisma, oneOnOne, notify } = setup({ open: true, slots: [later] });
    prisma.pastoralBooking.findFirst.mockResolvedValue(row({ startsAt: new Date(Date.now() + 9 * 24 * 3_600_000) }));
    await svc.propose(pastor, 'h1', 'b1', { startsAt: later, format: 'PHONE' });
    expect(oneOnOne.computeOpenSlots).toHaveBeenCalledWith('h1', 'st1', '2026-11-12', '2026-11-12', expect.objectContaining({ excludeBookingId: 'b1' }));
    expect(prisma.pastoralBooking.update.mock.calls[0][0].data).toMatchObject({ status: 'PROPOSED', proposedStartsAt: new Date(later) });
    expect(notify.toRequester).toHaveBeenCalledWith(expect.anything(), 'PROPOSED', null);
  });

  it('will not approve a request twice', async () => {
    const { svc, prisma } = setup();
    prisma.pastoralBooking.findFirst.mockResolvedValue(row({ status: 'APPROVED', startsAt: new Date(Date.now() + 86_400_000) }));
    await expect(svc.approve(pastor, 'h1', 'b1', { format: 'IN_PERSON' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('shows the private note to the pastor but not to a delegate', async () => {
    const future = new Date(Date.now() + 5 * 86_400_000);
    const { svc, prisma, oneOnOne } = setup();
    prisma.pastoralBooking.findMany.mockResolvedValue([row({ startsAt: future, endsAt: new Date(future.getTime() + 3_600_000) })]);

    const asPastor = await svc.listForHost(pastor, 'h1');
    expect(asPastor.waiting[0].note).toBe('secret');

    oneOnOne.assertCanManage.mockResolvedValue({ host: { id: 'h1' }, isOwner: false });
    const asDelegate = await svc.listForHost(member, 'h1');
    expect(asDelegate.waiting[0].note).toBeNull();
    expect(asDelegate.waiting[0].hasNote).toBe(true);
  });
});

describe('meeting links on approval', () => {
  const future = new Date(Date.now() + 5 * 86_400_000);
  function online(overrides: Record<string, unknown> = {}) {
    const s = setup();
    const r = row({ format: 'GOOGLE_MEET', startsAt: future, endsAt: new Date(future.getTime() + 3_600_000), ...overrides });
    s.prisma.pastoralBooking.findFirst.mockResolvedValue(r);
    s.prisma.pastoralBooking.findUniqueOrThrow.mockResolvedValue(r);
    return s;
  }
  const linkWritten = (prisma: ReturnType<typeof setup>['prisma']) =>
    prisma.pastoralBooking.update.mock.calls.map((c) => c[0].data).find((d) => 'meetLink' in d)?.meetLink;

  it('uses a pasted Google Meet or Zoom link, and skips creating a Meet', async () => {
    const { svc, prisma, calendar } = online();
    await svc.approve(pastor, 'h1', 'b1', { format: 'GOOGLE_MEET', meetLink: 'https://zoom.us/j/999' });
    expect(calendar.createEvent).toHaveBeenCalledWith(expect.objectContaining({ withMeet: false }));
    expect(linkWritten(prisma)).toBe('https://zoom.us/j/999');
  });

  it('falls back to a Meet created in Google, then to the pastor’s standing link', async () => {
    const auto = online();
    await auto.svc.approve(pastor, 'h1', 'b1', { format: 'GOOGLE_MEET' });
    expect(linkWritten(auto.prisma)).toBe('https://meet.google.com/auto');

    const standing = online();
    standing.calendar.createEvent.mockResolvedValue(null);
    await standing.svc.approve(pastor, 'h1', 'b1', { format: 'GOOGLE_MEET' });
    expect(linkWritten(standing.prisma)).toBe('https://zoom.us/j/standing');
  });

  it('gives in-person sessions no link', async () => {
    const { svc, prisma } = online({ format: 'IN_PERSON' });
    await svc.approve(pastor, 'h1', 'b1', { format: 'IN_PERSON', meetLink: 'https://zoom.us/j/999' });
    expect(linkWritten(prisma)).toBeNull();
  });
});

describe('visitor requests', () => {
  const visitorDto = {
    ...dto,
    note: undefined,
    format: 'GOOGLE_MEET' as const,
    fullName: 'Daniel Mensah',
    email: 'Daniel@Example.com',
    phone: '+233 24 123 4567',
    location: 'Accra, Ghana',
    foundVia: 'YouTube' as const,
    inIbadan: false,
  };

  it('holds the time unconfirmed and emails a confirmation link', async () => {
    const { svc, prisma, oneOnOne, notify } = setup();
    await svc.createVisitorRequest(visitorDto);
    const data = prisma.pastoralBooking.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ status: 'HOLD', requesterType: 'VISITOR', requesterEmail: 'daniel@example.com' });
    expect(data.holdExpiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 60_000);
    expect(oneOnOne.computeOpenSlots).toHaveBeenCalledWith('h1', 'st1', '2026-11-12', '2026-11-12', expect.objectContaining({ audience: 'VISITOR' }));
    expect(prisma.visitor.create).toHaveBeenCalled();
    expect(notify.toRequester).toHaveBeenCalledWith(expect.anything(), 'VERIFY');
    expect(notify.toHostSide).not.toHaveBeenCalled();
  });

  it('leaves how to meet for the pastor to decide', async () => {
    const { svc, prisma } = setup();
    await svc.createVisitorRequest({ ...visitorDto, format: 'IN_PERSON' });
    expect(prisma.pastoralBooking.create.mock.calls[0][0].data.format).toBeNull();
  });

  it('quietly drops submissions that fill the hidden spam field', async () => {
    const { svc, prisma } = setup();
    await svc.createVisitorRequest({ ...visitorDto, website: 'http://spam' });
    expect(prisma.pastoralBooking.create).not.toHaveBeenCalled();
  });

  it('rejects a tampered private link', async () => {
    const { svc } = setup();
    await expect(svc.getByToken('b1.forged')).rejects.toThrow(/isn’t valid/);
  });
});

describe('session types that skip the topic question', () => {
  it('requires a topic when the session type asks for one', async () => {
    const { svc } = setup();
    await expect(svc.createMemberRequest(member, { ...dto, topic: undefined })).rejects.toThrow(/talk about/);
  });

  it('keeps no topic, and needs none, when the question is switched off', async () => {
    const { svc, prisma } = setup();
    prisma.pastorSessionType.findFirst.mockResolvedValue({ id: 'st1', hostId: 'h1', jointWithHostId: null, askTopic: false });
    await svc.createMemberRequest(member, { ...dto, topic: undefined, note: 'I want to talk about the next cohort' });
    const data = prisma.pastoralBooking.create.mock.calls[0][0].data;
    expect(data.topic).toBeNull();
    expect(data.noteEncrypted).toBe('enc:I want to talk about the next cohort');
  });
});

describe('cancelling needs a reason', () => {
  it('refuses to cancel without one, and passes it to the pastor', async () => {
    const { svc, notify } = setup({ open: true });
    await expect(svc.cancelMine(member, 'b1', {})).rejects.toThrow(/know why/);
    await svc.cancelMine(member, 'b1', { note: 'My mum is unwell' });
    expect(notify.toHostSide).toHaveBeenCalledWith(expect.anything(), 'WITHDRAWN', 'My mum is unwell');
  });
});

describe('passing a request to another pastor', () => {
  const future = new Date(Date.now() + 6 * 86_400_000);
  function assignSetup(slots: string[]) {
    const s = setup();
    const r = row({ startsAt: future, endsAt: new Date(future.getTime() + 3_600_000), requesterType: 'VISITOR', anonymousIntake: true });
    s.prisma.pastoralBooking.findFirst.mockResolvedValue(r);
    (s.prisma as Record<string, unknown>).pastorHost = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'h2',
        displayName: 'Pastor Faith',
        SessionTypes: [{ id: 'f60', durationMinutes: 60, visitorsCanBook: true }],
      }),
    };
    s.oneOnOne.computeOpenSlots.mockResolvedValue([{ date: 'x', slots: slots.map((st) => ({ startsAt: st, endsAt: st })) }]);
    return s;
  }

  it('moves it to the chosen pastor, keeping the time, and tells their side', async () => {
    const { svc, prisma, notify } = assignSetup([future.toISOString()]);
    const result = await svc.assign(pastor, 'h1', 'b1', { toHostId: 'h2' });
    expect(prisma.pastoralBooking.update.mock.calls[0][0].data).toMatchObject({ hostId: 'h2', sessionTypeId: 'f60', assignedById: 'pastor-faith' });
    expect(result.fits).toBe(true);
    expect(notify.toHostSide).toHaveBeenCalledWith(expect.anything(), 'ASSIGNED', null);
  });

  it('warns the new pastor when the time is outside their hours', async () => {
    const { svc, notify } = assignSetup([]);
    const result = await svc.assign(pastor, 'h1', 'b1', { toHostId: 'h2', note: 'Can you take this one?' });
    expect(result.fits).toBe(false);
    expect(notify.toHostSide.mock.calls[0][2]).toMatch(/Can you take this one\?[\s\S]*suggest another time/);
  });
});

describe('the pastor decides how to meet', () => {
  it('saves a new request with no format, and records the one chosen on approval', async () => {
    const { svc, prisma } = setup();
    await svc.createMemberRequest(member, { ...dto, format: 'IN_PERSON' });
    expect(prisma.pastoralBooking.create.mock.calls[0][0].data.format).toBeNull();

    const s = setup();
    s.prisma.pastoralBooking.findFirst.mockResolvedValue(row({ format: null, startsAt: new Date(Date.now() + 86_400_000) }));
    await s.svc.approve(pastor, 'h1', 'b1', { format: 'PHONE' });
    expect(s.prisma.pastoralBooking.update.mock.calls[0][0].data).toMatchObject({ status: 'APPROVED', format: 'PHONE' });
  });
});
