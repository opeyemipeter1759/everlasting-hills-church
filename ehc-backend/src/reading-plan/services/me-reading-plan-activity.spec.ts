import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import { MeReadingPlanService } from './me-reading-plan.service';

/**
 * The effort a member sees on their reading overview.
 *
 * Readings are counted from the day log, so two plans read on one date are two
 * readings on that date, and the calendar shows when somebody actually read.
 */
const actor = {
  profileId: 'profile-1',
  tenantId: 'tenant-1',
  effectiveRoles: [Role.MEMBER],
} as unknown as AuthUser;

const day = (date: string, readings: number) => ({
  completedOn: new Date(`${date}T00:00:00Z`),
  _count: { _all: readings },
});

function makeService({
  timezone = 'Africa/Lagos' as string | null,
  rows = [] as ReturnType<typeof day>[],
  minutes = null as number | null,
} = {}) {
  const prisma = {
    memberPlanSubscription: {
      findFirst: jest.fn(async () => (timezone ? { timezone } : null)),
    },
    memberPlanProgress: { groupBy: jest.fn(async () => rows) },
    $queryRaw: jest.fn(async () => [{ minutes }]),
  };
  const service = new MeReadingPlanService(
    prisma as never,
    {} as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, prisma };
}

afterEach(() => jest.useRealTimers());

describe('reading activity', () => {
  it('counts readings per date across plans within a twelve-week calendar', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-13T10:00:00Z'));
    const { service } = makeService({
      rows: [day('2026-09-13', 2), day('2026-06-01', 3), day('2026-09-10', 1)],
      minutes: 47,
    });

    const activity = await service.activity(actor);

    expect(activity.today).toBe('2026-09-13');
    // 84 days, today included.
    expect(activity.from).toBe('2026-06-22');
    // Two plans read on the 13th are two readings on that date. June is
    // outside the calendar but still counts towards the totals.
    expect(activity.days).toEqual([
      { date: '2026-09-10', readings: 1 },
      { date: '2026-09-13', readings: 2 },
    ]);
    expect(activity.totals).toEqual({
      readings: 6,
      activeDays: 3,
      activeDaysLast30: 2,
      minutes: 47,
    });
  });

  it('decides "today" in the timezone the member last read in', async () => {
    // 02:00 UTC is still the 12th in New York but already the 13th in Lagos.
    jest.useFakeTimers().setSystemTime(new Date('2026-09-13T02:00:00Z'));

    const newYork = await makeService({ timezone: 'America/New_York' }).service.activity(actor);
    expect(newYork.today).toBe('2026-09-12');

    const lagos = await makeService({ timezone: null }).service.activity(actor);
    expect(lagos.timezone).toBe('Africa/Lagos');
    expect(lagos.today).toBe('2026-09-13');
  });

  it("scopes every query to the caller's own tenant and profile", async () => {
    const { service, prisma } = makeService();

    await service.activity(actor);

    expect(prisma.memberPlanSubscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', profileId: 'profile-1' } }),
    );
    expect(prisma.memberPlanProgress.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', profileId: 'profile-1' } }),
    );
    const sql = (prisma.$queryRaw as jest.Mock).mock.calls[0][0] as { values: unknown[] };
    expect(sql.values).toEqual(['tenant-1', 'profile-1']);
  });

  it('shows nothing but zeros to someone who has never read', async () => {
    const { service } = makeService({ timezone: null });

    const activity = await service.activity(actor);

    expect(activity.days).toEqual([]);
    expect(activity.totals).toEqual({ readings: 0, activeDays: 0, activeDaysLast30: 0, minutes: 0 });
  });

  it('refuses an account with no profile', async () => {
    const { service } = makeService();
    await expect(
      service.activity({ ...actor, profileId: null } as AuthUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
