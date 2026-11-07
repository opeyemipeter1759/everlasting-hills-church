import { PrayerWatchStatsService, lagosWeekStart } from './prayer-watch-stats.service';

const NOW = new Date('2026-11-07T10:00:00Z'); // Saturday

function setup(signups: Record<string, unknown>[]) {
  const watch = {
    id: 'w1',
    title: 'Prayer Watch',
    telegramLink: null,
    Slots: [
      { id: 's1', label: 'First Watch', startTime: '22:00', endTime: '00:00', capacity: 100, leaderId: 'sg1', leaderTermEndsAt: new Date('2027-02-01'), whatsappLink: 'https://chat.whatsapp.com/x', Leader: { fullName: 'Tolu Ade' } },
      { id: 's2', label: 'Second Watch', startTime: '00:00', endTime: '02:00', capacity: 100, leaderId: null, leaderTermEndsAt: null, whatsappLink: null, Leader: null },
    ],
  };
  const prisma = {
    prayerWatch: { findFirst: jest.fn().mockResolvedValue(watch) },
    prayerSignup: { findMany: jest.fn().mockResolvedValue(signups) },
    prayerFamilyChangeRequest: { count: jest.fn().mockResolvedValue(2) },
    prayerWatchReflection: {
      count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(10),
      findFirst: jest.fn().mockResolvedValue({ body: 'He said rest.', createdAt: NOW, Signup: { fullName: 'Ada Obi', Slot: { label: 'First Watch' } } }),
    },
  };
  return new PrayerWatchStatsService(prisma as never, { get: () => 't1' } as never);
}

const signup = (o: Record<string, unknown>) => ({ slotId: 's1', status: 'CONFIRMED', isWorker: false, createdAt: new Date('2026-11-02T09:00:00Z'), decidedAt: null, ...o });

describe('PrayerWatchStatsService.overview', () => {
  it('counts people per watch and what is waiting', async () => {
    const svc = setup([
      signup({ isWorker: true }),
      signup({}),
      signup({ slotId: 's2' }),
      signup({ status: 'PENDING', createdAt: new Date('2026-11-05T09:00:00Z') }),
      signup({ status: 'DECLINED' }),
    ]);
    const o = (await svc.overview(NOW))!;
    expect(o.totals).toMatchObject({ confirmed: 3, workers: 1, pending: 1, declined: 1, familyChangesPending: 2, reflections30d: 3, reflectionsTotal: 10 });
    expect(o.slots.map((s) => [s.label, s.confirmed, s.pending])).toEqual([
      ['First Watch', 2, 1],
      ['Second Watch', 1, 0],
    ]);
    expect(o.slots[0]).toMatchObject({ leaderName: 'Tolu Ade', whatsappLinkSet: true });
    expect(o.slots[1]).toMatchObject({ leaderName: null, leaderTermEndsAt: null, whatsappLinkSet: false });
    expect(o.oldestPendingAt).toBe('2026-11-05T09:00:00.000Z');
    expect(o.latestReflection).toMatchObject({ firstName: 'Ada', watchLabel: 'First Watch' });
  });

  it('buckets joins into the last twelve Lagos weeks by approval date', async () => {
    const svc = setup([
      signup({ decidedAt: new Date('2026-11-03T12:00:00Z') }), // this week
      signup({ decidedAt: new Date('2026-10-27T12:00:00Z') }), // last week
      signup({ decidedAt: new Date('2025-01-01T12:00:00Z') }), // too old to show
    ]);
    const o = (await svc.overview(NOW))!;
    expect(o.weekly).toHaveLength(12);
    expect(o.weekly[11]).toEqual({ weekStart: '2026-11-02', joined: 1 });
    expect(o.weekly[10]).toEqual({ weekStart: '2026-10-26', joined: 1 });
    expect(o.weekly.reduce((n, w) => n + w.joined, 0)).toBe(2);
  });

  it('reports the median wait for an answer over recent decisions', async () => {
    const created = new Date('2026-11-01T00:00:00Z');
    const svc = setup([
      signup({ createdAt: created, decidedAt: new Date('2026-11-01T02:00:00Z') }),
      signup({ createdAt: created, decidedAt: new Date('2026-11-01T06:00:00Z') }),
      signup({ createdAt: created, decidedAt: new Date('2026-11-02T00:00:00Z') }),
    ]);
    expect((await svc.overview(NOW))!.medianWaitHours).toBe(6);
  });
});

describe('lagosWeekStart', () => {
  it('uses Monday in Lagos time, even late on a Sunday in UTC', () => {
    expect(lagosWeekStart(new Date('2026-11-08T23:30:00Z'))).toBe('2026-11-09');
    expect(lagosWeekStart(new Date('2026-11-08T22:30:00Z'))).toBe('2026-11-02');
  });
});
