import { Prisma } from '@prisma/client';
import { PrayerWatchReportsService } from './prayer-watch-reports.service';
import { isWatchNight, lagosNightOf, latestNightStarted, recentWatchNights, watchMinutes } from './prayer-watch-nights';
import { summarizeReports } from './prayer-watch-report-summary';

// Tuesday 01:20 in Lagos: Monday night's First Watch ended 80 minutes ago, the Second is under way.
const NOW = new Date('2026-11-10T00:20:00Z');

const SLOTS = [
  { id: 's1', label: 'First Watch', startTime: '22:00', endTime: '00:00', Leader: { profileId: 'p1', fullName: 'Tolu Ade', email: 'Tolu@Example.com' } },
  { id: 's2', label: 'Second Watch', startTime: '00:00', endTime: '02:00', Leader: { profileId: 'p2', fullName: 'Bisi Ojo', email: 'bisi@example.com' } },
  { id: 's3', label: 'Third Watch', startTime: '02:00', endTime: '04:00', Leader: null },
  { id: 's4', label: 'Fourth Watch', startTime: '04:00', endTime: '06:00', Leader: null },
];

const user = (o: Record<string, unknown> = {}) =>
  ({ userId: 'u1', email: 'someone@example.com', role: 'MEMBER', effectiveRoles: ['MEMBER'], profileId: 'p1', ...o }) as never;

function setup() {
  const prisma = {
    prayerWatch: { findFirst: jest.fn().mockResolvedValue({ Slots: SLOTS }) },
    prayerWatchReport: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ ...create, updatedAt: NOW })),
    },
    pushNoticeLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const events = { emit: jest.fn() };
  const push = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const svc = new PrayerWatchReportsService(prisma as never, events as never, push as never, { get: () => 't1' } as never);
  return { svc, prisma, events, push };
}

const report = (o: Record<string, unknown>) => ({ slotId: 's1', nightDate: new Date('2026-11-06T00:00:00Z'), minutesPrayed: 120, peoplePresent: 10, handedOver: true, handedOverTo: null, notes: null, ...o });

describe('watch nights', () => {
  it('names a night by the evening it began, and rests on Sunday', () => {
    expect(lagosNightOf(new Date('2026-11-10T02:00:00Z'))).toBe('2026-11-09');
    expect(lagosNightOf(new Date('2026-11-10T21:30:00Z'))).toBe('2026-11-10');
    expect(isWatchNight('2026-11-08')).toBe(false);
    expect(recentWatchNights('2026-11-09', 3)).toEqual(['2026-11-09', '2026-11-07', '2026-11-06']);
  });

  it('only counts a night once that watch has begun', () => {
    expect(latestNightStarted(NOW, '00:00')).toBe('2026-11-09');
    expect(latestNightStarted(NOW, '02:00')).toBe('2026-11-08');
  });

  it('measures a watch across midnight and refuses one that runs backwards or by day', () => {
    expect(watchMinutes('2026-11-09', '22:00', '00:00')).toBe(120);
    expect(watchMinutes('2026-11-09', '23:40', '01:10')).toBe(90);
    expect(watchMinutes('2026-11-09', '01:00', '00:30')).toBeNull();
    expect(watchMinutes('2026-11-09', '13:00', '14:00')).toBeNull();
  });
});

describe('summarizeReports', () => {
  const reports = [
    report({}),
    report({ slotId: 's2', peoplePresent: 8 }),
    report({ nightDate: new Date('2026-11-07T00:00:00Z'), minutesPrayed: 90, peoplePresent: 5, handedOver: false }),
    report({ nightDate: new Date('2026-11-09T00:00:00Z'), peoplePresent: 12 }),
  ];
  const s = summarizeReports(SLOTS, reports, '2026-11-06', NOW)!;

  it('adds up hours per night and per week', () => {
    expect(s.fullNightMinutes).toBe(480);
    expect(s.daily).toHaveLength(24);
    expect(s.daily[23]).toMatchObject({ night: '2026-11-09', tracked: true, minutes: 120, reported: 1, missing: 0 });
    expect(s.daily[22]).toMatchObject({ night: '2026-11-07', minutes: 90, missing: 3 });
    expect(s.daily[0].tracked).toBe(false);
    expect(s.thisWeekMinutes).toBe(120);
    expect(s.lastWeekMinutes).toBe(330);
  });

  it('counts missing reports only for watches that are over, and only since reports began', () => {
    expect(s.reportsIn).toBe(4);
    expect(s.reportsDue).toBe(9);
    expect(s.handoversMade).toBe(3);
    expect(s.averagePeople).toBe(8.8);
    expect(s.chain.map((c) => c.night)).toEqual(['2026-11-09', '2026-11-07', '2026-11-06']);
    expect(s.chain[0].watches.map((w) => w.status)).toEqual(['reported', 'not-yet', 'not-yet', 'not-yet']);
  });
});

describe('PrayerWatchReportsService', () => {
  const dto = { slotId: 's1', nightDate: '2026-11-09', startTime: '22:05', endTime: '00:00', peoplePresent: 12, handedOver: true };

  it('files the leader’s report, timing it and naming the next leader', async () => {
    const { svc, prisma } = setup();
    const view = await svc.submit(user(), dto, NOW);
    const call = prisma.prayerWatchReport.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ slotId_nightDate: { slotId: 's1', nightDate: new Date('2026-11-09T00:00:00Z') } });
    expect(call.create).toMatchObject({ minutesPrayed: 115, peoplePresent: 12, handedOverTo: 'Bisi Ojo', reportedById: 'p1' });
    expect(view).toMatchObject({ night: '2026-11-09', startTime: '22:05', endTime: '00:00', minutes: 115 });
  });

  it('recognises a leader by the email on their sign-up', async () => {
    const { svc } = setup();
    await expect(svc.submit(user({ profileId: 'other', email: 'tolu@example.com' }), dto, NOW)).resolves.toBeDefined();
  });

  it('turns away someone who does not lead the watch', async () => {
    const { svc } = setup();
    await expect(svc.submit(user({ profileId: 'p9' }), dto, NOW)).rejects.toThrow('Only the leader');
  });

  it('refuses a watch that has not started, and a night too far back for a leader', async () => {
    const { svc } = setup();
    await expect(svc.submit(user(), { ...dto, nightDate: '2026-11-10' }, NOW)).rejects.toThrow("hasn't started");
    await expect(svc.submit(user(), { ...dto, nightDate: '2026-10-20' }, NOW)).rejects.toThrow('too far back');
    await expect(svc.submit(user({ effectiveRoles: ['ADMIN_HEAD'], profileId: 'p9' }), { ...dto, nightDate: '2026-10-20' }, NOW)).resolves.toBeDefined();
  });

  it('nudges the leader once after their watch ends with no report', async () => {
    const { svc, events, push, prisma } = setup();
    expect(await svc.sendReminders(NOW)).toEqual({ nudged: 1 });
    expect(events.emit.mock.calls[0][1]).toMatchObject({ to: 'Tolu@Example.com', subject: 'How did the First Watch go on Monday night?' });
    expect(push.dispatch.mock.calls[0][1]).toEqual({ userIds: ['p1'], tenantId: 't1' });

    prisma.pushNoticeLog.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' }));
    expect(await svc.sendReminders(NOW)).toEqual({ nudged: 0 });
  });

  it('stays quiet when the report is already in', async () => {
    const { svc, prisma, events } = setup();
    prisma.prayerWatchReport.count.mockResolvedValue(1);
    expect(await svc.sendReminders(NOW)).toEqual({ nudged: 0 });
    expect(events.emit).not.toHaveBeenCalled();
  });
});
