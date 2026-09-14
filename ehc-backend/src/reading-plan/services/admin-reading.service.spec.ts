import { MemberStatus, SubscriptionStatus } from '@prisma/client';
import { AdminReadingService } from './admin-reading.service';

/**
 * What pastors and admins see on the reading monitor.
 *
 * "Reading" means a reading in the last seven days on Lagos's calendar.
 * Someone with a plan in progress who has not read this week has gone quiet,
 * and that is the state the page exists to surface.
 */
const date = (iso: string) => new Date(`${iso}T00:00:00Z`);

const MEMBERS = [
  { id: 'm-ada', profileId: 'p-ada', firstName: 'Ada', lastName: 'Reads', photoUrl: null },
  { id: 'm-ben', profileId: 'p-ben', firstName: 'Ben', lastName: 'Quiet', photoUrl: null },
  { id: 'm-cal', profileId: 'p-cal', firstName: 'Cal', lastName: 'Done', photoUrl: 'https://x/c.jpg' },
  { id: 'm-dee', profileId: 'p-dee', firstName: 'Dee', lastName: 'New', photoUrl: null },
];

const plan = (
  profileId: string,
  status: SubscriptionStatus,
  lastReadOn: string | null,
  extra: Partial<{ completedDays: number; currentStreak: number; title: string; durationDays: number }> = {},
) => ({
  profileId,
  status,
  completedDays: extra.completedDays ?? 5,
  currentStreak: extra.currentStreak ?? 0,
  lastReadOn: lastReadOn ? date(lastReadOn) : null,
  Plan: { title: extra.title ?? 'A plan', durationDays: extra.durationDays ?? 30 },
});

const SUBSCRIPTIONS = [
  plan('p-ada', SubscriptionStatus.ACTIVE, '2026-09-14', { currentStreak: 4, title: 'Gospels', completedDays: 12 }),
  plan('p-ada', SubscriptionStatus.PAUSED, '2026-08-01', { currentStreak: 9, title: 'Psalms' }),
  plan('p-ben', SubscriptionStatus.ACTIVE, '2026-09-01', { title: 'Proverbs' }),
  plan('p-cal', SubscriptionStatus.COMPLETED, '2026-08-20', { completedDays: 31, durationDays: 31 }),
];

function makeService() {
  const groupBy = jest.fn(async ({ where }: { where: { completedOn: { gte: Date } } }) =>
    // The week window starts on the 8th, the month window in August.
    where.completedOn.gte.toISOString().startsWith('2026-09-08')
      ? [{ profileId: 'p-ada', _count: { _all: 3 } }]
      : [
          { profileId: 'p-ada', _count: { _all: 10 } },
          { profileId: 'p-ben', _count: { _all: 2 } },
          { profileId: 'p-gone', _count: { _all: 7 } },
        ],
  );
  const prisma = {
    member: { findMany: jest.fn(async () => MEMBERS) },
    memberPlanSubscription: { findMany: jest.fn(async () => SUBSCRIPTIONS) },
    memberPlanProgress: { groupBy },
  };
  const service = new AdminReadingService(
    prisma as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, prisma };
}

beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-09-14T10:00:00Z')));
afterEach(() => jest.useRealTimers());

describe('reading monitor', () => {
  it('sorts every active member into reading, gone quiet, finished or not started', async () => {
    const { service } = makeService();
    const { readers } = await service.overview();
    const state = (name: string) => readers.find((reader) => reader.name.startsWith(name))?.state;

    expect(state('Ada')).toBe('READING');
    expect(state('Ben')).toBe('QUIET');
    expect(state('Cal')).toBe('FINISHED');
    expect(state('Dee')).toBe('NOT_STARTED');
  });

  it('shows the latest reading across plans and the streak of the active plans only', async () => {
    const { service } = makeService();
    const ada = (await service.overview()).readers.find((reader) => reader.memberId === 'm-ada')!;

    expect(ada.lastReadOn).toBe('2026-09-14');
    // The paused plan's longer streak is not a streak Ada is on now.
    expect(ada.currentStreak).toBe(4);
    expect(ada.readingsLast7).toBe(3);
    expect(ada.readingsLast30).toBe(10);
    expect(ada.plans.map((p) => p.title)).toEqual(['Gospels', 'Psalms']);
  });

  it('totals the church without counting people who are no longer active members', async () => {
    const { service } = makeService();
    const { stats } = await service.overview();

    expect(stats).toEqual({
      activeMembers: 4,
      reading: 1,
      quiet: 1,
      finished: 1,
      notStarted: 1,
      // p-gone read 7 times this month but is not an active member.
      readingsThisWeek: 3,
      plansCompleted: 1,
    });
  });

  it('reads only active members, only this church, and windows the counts on Lagos dates', async () => {
    const { service, prisma } = makeService();
    await service.overview();

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', status: MemberStatus.ACTIVE } }),
    );
    expect(prisma.memberPlanSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
    const windows = (prisma.memberPlanProgress.groupBy as jest.Mock).mock.calls.map(
      ([args]) => [args.where.tenantId, args.where.completedOn.gte.toISOString().slice(0, 10)],
    );
    expect(windows).toEqual([
      ['tenant-1', '2026-09-08'],
      ['tenant-1', '2026-08-16'],
    ]);
  });
});
