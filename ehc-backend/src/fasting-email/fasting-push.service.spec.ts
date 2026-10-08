import { Prisma } from '@prisma/client';
import { FastingPushService, fastSessions, parseClock } from './fasting-push.service';
import { fastDay } from './fasting-day.util';

const FAST = {
  eventSlug: 'furnace-2026',
  eventTitle: 'Furnace 2026',
  theme: 'Dominion',
  imageUrl: null,
  liveUrl: 'https://www.youtube.com/@everlastinghillschurch/streams',
  rules: {
    startDate: '2026-10-02',
    endDate: '2026-10-31',
    mealTime: '3pm',
    dryFasts: [],
    morningTime: '6am',
    eveningTime: '8pm',
    noMorningDays: [0],
    noEveningDays: [6],
    serviceDays: [0],
  },
};

function setup(stream: { id: string; title: string } | null = null) {
  const claimed = new Set<string>();
  const prisma = {
    pushNoticeLog: {
      count: jest.fn(async ({ where }: { where: { key: string } }) => (claimed.has(where.key) ? 1 : 0)),
      create: jest.fn(async ({ data }: { data: { key: string } }) => {
        if (claimed.has(data.key)) {
          throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' });
        }
        claimed.add(data.key);
        return data;
      }),
    },
  };
  const dispatch = { dispatch: jest.fn().mockResolvedValue({ delivered: 1, attempted: 1 }) };
  const youtube = { configured: true, liveNow: jest.fn().mockResolvedValue(stream) };
  const fasts = { on: jest.fn().mockResolvedValue(FAST), tenant: 't1' };
  const svc = new FastingPushService(prisma as never, dispatch as never, youtube as never, fasts as never);
  return { svc, dispatch, youtube };
}

describe('Furnace push notifications', () => {
  it('reads the times the schedule is written in', () => {
    expect(parseClock('6am')).toBe(360);
    expect(parseClock('8 pm')).toBe(1200);
    expect(parseClock('5:30pm')).toBe(1050);
    expect(parseClock('12am')).toBe(0);
    expect(parseClock('noon')).toBeNull();
  });

  it('knows each day’s sessions: Sunday service, no Saturday evening', () => {
    const sunday = fastSessions(FAST, fastDay(FAST.rules, '2026-10-04')!);
    expect(sunday.map((s) => [s.key, s.startsAt.toISOString()])).toEqual([
      ['service', '2026-10-04T08:00:00.000Z'],
      ['evening', '2026-10-04T19:00:00.000Z'],
    ]);
    expect(fastSessions(FAST, fastDay(FAST.rules, '2026-10-03')!).map((s) => s.key)).toEqual(['morning']);
  });

  it('reminds everyone two hours before, once', async () => {
    const { svc, dispatch } = setup();
    // 4:00am in Lagos, Thursday 8 October: morning prayer is at 6am.
    expect(await svc.run(new Date('2026-10-08T03:00:00Z'))).toEqual(['morning:2h']);
    expect(dispatch.dispatch).toHaveBeenCalledWith(
      'serviceReminder',
      { tenantId: 't1' },
      expect.objectContaining({ title: 'Furnace 2026 · Morning prayer in 2 hours', body: expect.stringContaining('Day 7 of 30') }),
    );
    expect(await svc.run(new Date('2026-10-08T03:05:00Z'))).toEqual([]);
  });

  it('says when the stream goes live, with a Join button straight to it', async () => {
    const { svc, dispatch } = setup({ id: 'abc123', title: 'Furnace Day 7' });
    expect(await svc.run(new Date('2026-10-08T05:02:00Z'))).toEqual(['morning:live']);
    const payload = dispatch.dispatch.mock.calls[0][2];
    expect(dispatch.dispatch.mock.calls[0][0]).toBe('serviceStarting');
    expect(payload.title).toBe('🔥 Furnace 2026 is live: Morning prayer');
    expect(payload.actions).toEqual([{ action: 'join', title: 'Join live', url: 'https://www.youtube.com/watch?v=abc123' }]);
    expect(await svc.run(new Date('2026-10-08T05:07:00Z'))).toEqual([]);
  });

  it('waits for the stream, then says it has started anyway', async () => {
    const { svc, dispatch, youtube } = setup(null);
    expect(await svc.run(new Date('2026-10-08T05:05:00Z'))).toEqual([]);
    expect(youtube.liveNow).toHaveBeenCalled();
    expect(await svc.run(new Date('2026-10-08T05:16:00Z'))).toEqual(['morning:live']);
    expect(dispatch.dispatch.mock.calls[0][2]).toMatchObject({
      title: 'Furnace 2026 · Morning prayer has started',
      url: FAST.liveUrl,
    });
  });

  it('opens the fast with "has started" on its first session', async () => {
    const { svc, dispatch } = setup({ id: 'v1', title: 'Day 1' });
    // Friday 2 October, 6:01am in Lagos.
    await svc.run(new Date('2026-10-02T05:01:00Z'));
    expect(dispatch.dispatch.mock.calls[0][2].title).toBe('🔥 Furnace 2026 has started');
  });

  it('is quiet outside a fast', async () => {
    const { svc, dispatch } = setup();
    (svc as unknown as { fasts: { on: jest.Mock } }).fasts.on.mockResolvedValue(null);
    expect(await svc.run(new Date('2026-11-05T03:00:00Z'))).toEqual([]);
    expect(dispatch.dispatch).not.toHaveBeenCalled();
  });
});
