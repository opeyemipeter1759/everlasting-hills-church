import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MeReadingPlanService } from './me-reading-plan.service';
import { PlanProgressRepository } from './plan-progress.repository';
import type { AuthUser } from '../../auth/types/auth-user';

const ACTOR = { profileId: 'profile-1' } as AuthUser;
type Row = Record<string, any>;

function subscription(overrides: Row = {}): Row {
  const planId = overrides.planId ?? 'plan-1';
  return {
    id: 'sub-1',
    tenantId: 'tenant-1',
    profileId: 'profile-1',
    planId,
    planVersion: 1,
    translationId: 1,
    status: 'ACTIVE',
    anchorDate: null,
    timezone: 'Africa/Lagos',
    currentDayIndex: 1,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadOn: null,
    graceUsedOn: null,
    reminderHour: null,
    completedAt: null,
    startedOn: new Date('2026-09-01T00:00:00Z'),
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    Plan: {
      id: planId,
      slug: planId,
      title: `Reading ${planId}`,
      durationDays: 90,
      coverImageUrl: null,
    },
    Translation: { id: 1, code: 'WEB', name: 'World English Bible' },
    ...overrides,
  };
}

/** Stateful persistence fake retaining separate subscriptions and sparse logs. */
function setup(
  initial: Row[] = [subscription()],
  initialDays: Record<string, number[]> = {},
) {
  const subscriptions = new Map(initial.map((row) => [row.id, { ...row }]));
  const logs = new Map(
    Object.entries(initialDays).map(([id, days]) => [id, new Set(days)]),
  );
  const daysFor = (id: string) => {
    if (!logs.has(id)) logs.set(id, new Set());
    return logs.get(id)!;
  };
  const findRows = ({ where, orderBy }: { where: Row; orderBy?: Row }) => {
    const rows = [...subscriptions.values()].filter((row) =>
      Object.entries(where).every(([key, value]) =>
        typeof value === 'object' && value !== null && 'not' in value
          ? row[key] !== value.not
          : typeof value === 'object' && value !== null && 'in' in value
            ? value.in.includes(row[key])
            : row[key] === value,
      ),
    );
    if (orderBy) {
      const key = Object.keys(orderBy)[0];
      rows.sort((a, b) => Number(b[key]) - Number(a[key]));
    }
    return rows.map((row) => ({ ...row }));
  };
  const prisma = {
    $queryRaw: jest.fn(async (_query: { sql: string }) => [
      { id: ACTOR.profileId },
    ]),
    memberPlanSubscription: {
      findFirst: jest.fn(
        async (args: { where: Row; orderBy?: Row }) =>
          findRows(args)[0] ?? null,
      ),
      findMany: jest.fn(async (args: { where: Row; orderBy?: Row }) =>
        findRows(args),
      ),
      create: jest.fn(async ({ data }: { data: Row }) => {
        const row = subscription({
          ...data,
          createdAt: new Date(Date.now() + subscriptions.size),
        });
        subscriptions.set(row.id, row);
        return { ...row };
      }),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: Row }) => {
          const row = subscriptions.get(where.id)!;
          Object.assign(row, data, { updatedAt: new Date() });
          return { ...row };
        },
      ),
    },
    memberPlanProgress: {
      createMany: jest.fn(
        async ({
          data,
        }: {
          data: { subscriptionId: string; dayIndex: number }[];
        }) => {
          const { subscriptionId, dayIndex } = data[0];
          const days = daysFor(subscriptionId);
          if (days.has(dayIndex)) return { count: 0 };
          days.add(dayIndex);
          return { count: 1 };
        },
      ),
      deleteMany: jest.fn(
        async ({
          where,
        }: {
          where: { subscriptionId: string; dayIndex: number };
        }) => ({
          count: daysFor(where.subscriptionId).delete(where.dayIndex) ? 1 : 0,
        }),
      ),
      findMany: jest.fn(
        async ({ where }: { where: { subscriptionId: string } }) =>
          [...daysFor(where.subscriptionId)]
            .sort((a, b) => a - b)
            .map((dayIndex) => ({ dayIndex })),
      ),
    },
    readingPlan: {
      findFirst: jest.fn(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        version: 1,
        durationDays: 90,
      })),
    },
    bibleTranslation: {
      findFirst: jest.fn(async () => ({
        id: 1,
        code: 'WEB',
        name: 'World English Bible',
      })),
      findUnique: jest.fn(async () => ({
        id: 2,
        code: 'KJV',
        name: 'King James Version',
      })),
    },
    readingPlanPortion: { count: jest.fn(async () => 2) },
    readingPlanDay: {
      findFirst: jest.fn(
        async ({ where }: { where: { planId: string; dayIndex: number } }) => ({
          dayIndex: where.dayIndex,
          title: null,
          referenceLabel: `${where.planId} reading`,
          reflectionPrompt: null,
          estimatedMinutes: 5,
          Portions: [],
        }),
      ),
    },
    $transaction: jest.fn(),
  };
  // Model PostgreSQL's member row lock across simultaneous transactions.
  let previous = Promise.resolve();
  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) => {
      const result = previous.then(() => callback(prisma));
      previous = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  );
  const service = new MeReadingPlanService(
    prisma as never,
    new PlanProgressRepository(prisma as never),
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, prisma, subscriptions, daysFor };
}

describe('reading multiple plans', () => {
  it('keeps three different plans active and leaves earlier progress unchanged', async () => {
    const earlier = subscription({
      completedDays: 2,
      currentDayIndex: 3,
      currentStreak: 2,
      longestStreak: 4,
    });
    const { service, subscriptions, daysFor } = setup([earlier], {
      'sub-1': [1, 2],
    });
    const second = await service.subscribe(ACTOR, { planId: 'plan-2' });
    const third = await service.subscribe(ACTOR, { planId: 'plan-3' });
    expect(
      [...subscriptions.values()].filter((row) => row.status === 'ACTIVE'),
    ).toHaveLength(3);
    expect(subscriptions.get('sub-1')).toEqual(earlier);
    expect([...daysFor('sub-1')]).toEqual([1, 2]);
    expect(second.planId).toBe('plan-2');
    expect(third.planId).toBe('plan-3');
  });

  it('returns the existing active subscription on simultaneous starts', async () => {
    const { service, prisma, subscriptions } = setup([]);
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        service.subscribe(ACTOR, { planId: 'plan-1' }),
      ),
    );
    expect(new Set(results.map((row) => row.id)).size).toBe(1);
    expect(subscriptions.size).toBe(1);
    expect(prisma.memberPlanSubscription.create).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    expect(prisma.$queryRaw.mock.calls[0][0].sql).toContain('FOR UPDATE');
  });

  it('resumes a paused subscription with all its original progress and preferences', async () => {
    const paused = subscription({
      status: 'PAUSED',
      completedDays: 2,
      currentDayIndex: 3,
      currentStreak: 2,
      longestStreak: 5,
      translationId: 2,
      reminderHour: 7,
      timezone: 'Europe/London',
    });
    const { service, subscriptions, daysFor } = setup(
      [paused, subscription({ id: 'sub-2', planId: 'plan-2' })],
      { 'sub-1': [1, 2] },
    );
    const resumed = await service.subscribe(ACTOR, {
      planId: 'plan-1',
      timezone: 'Africa/Lagos',
    });
    expect(resumed.id).toBe('sub-1');
    expect(subscriptions.size).toBe(2);
    expect(subscriptions.get('sub-1')).toMatchObject({
      ...paused,
      status: 'ACTIVE',
      updatedAt: expect.any(Date),
    });
    expect(subscriptions.get('sub-2')?.status).toBe('ACTIVE');
    expect([...daysFor('sub-1')]).toEqual([1, 2]);
  });

  it('starts a new reading while retaining completed history', async () => {
    const history = subscription({
      status: 'COMPLETED',
      completedDays: 90,
      currentDayIndex: 90,
      completedAt: new Date('2026-09-12T10:00:00Z'),
    });
    const { service, subscriptions } = setup([history]);
    const started = await service.subscribe(ACTOR, { planId: 'plan-1' });
    expect(started.id).not.toBe(history.id);
    expect(subscriptions.get(history.id)).toEqual(history);
    expect(subscriptions.get(started.id)?.completedDays).toBe(0);
  });

  it('pauses or resumes one plan without changing another', async () => {
    const other = subscription({
      id: 'sub-2',
      planId: 'plan-2',
      completedDays: 4,
      currentDayIndex: 5,
    });
    const { service, subscriptions } = setup([subscription(), other]);
    await service.update(ACTOR, 'sub-1', { status: 'PAUSED' });
    expect(subscriptions.get('sub-1')?.status).toBe('PAUSED');
    await service.update(ACTOR, 'sub-1', { status: 'ACTIVE' });
    expect(subscriptions.get('sub-1')?.status).toBe('ACTIVE');
    expect(subscriptions.get('sub-2')).toEqual(other);
  });

  it('refuses to resume a duplicate copy or overwrite completed history', async () => {
    const { service } = setup([
      subscription(),
      subscription({ id: 'paused', status: 'PAUSED' }),
      subscription({ id: 'finished', status: 'COMPLETED' }),
    ]);
    await expect(
      service.update(ACTOR, 'paused', { status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.update(ACTOR, 'finished', { status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('personal reading overview', () => {
  it('lists supported statuses with progress and dates, scoped to member and tenant', async () => {
    const { service, prisma } = setup([
      subscription({
        completedDays: 2,
        currentDayIndex: 3,
        longestStreak: 2,
        reminderHour: 8,
      }),
      subscription({ id: 'paused', planId: 'plan-2', status: 'PAUSED' }),
      subscription({
        id: 'done',
        status: 'COMPLETED',
        completedAt: new Date('2026-09-12T10:00:00Z'),
      }),
      subscription({ id: 'other-member', profileId: 'profile-2' }),
      subscription({ id: 'other-tenant', tenantId: 'tenant-2' }),
      subscription({ id: 'abandoned', status: 'ABANDONED' }),
    ]);
    const overview = await service.subscriptions(ACTOR);
    expect(overview).toHaveLength(3);
    expect(
      overview.find((row) => row.subscriptionId === 'sub-1'),
    ).toMatchObject({
      status: 'ACTIVE',
      startedOn: '2026-09-01',
      completedAt: null,
      completedDays: 2,
      currentDayIndex: 3,
      longestStreak: 2,
      reminderHour: 8,
      timezone: 'Africa/Lagos',
      plan: { id: 'plan-1', durationDays: 90 },
      translation: { code: 'WEB' },
      paceDelta: expect.any(Number),
      completedToday: expect.any(Boolean),
    });
    expect(
      overview.find((row) => row.subscriptionId === 'done')?.completedAt,
    ).toBe('2026-09-12T10:00:00.000Z');
    expect(overview.every((row) => !('day' in row))).toBe(true);
    expect(prisma.readingPlanDay.findFirst).not.toHaveBeenCalled();
  });

  it('opens a selected plan, including history, and defaults to the newest active plan', async () => {
    const { service } = setup([
      subscription({ currentDayIndex: 7 }),
      subscription({
        id: 'sub-2',
        planId: 'plan-2',
        createdAt: new Date('2026-09-10T00:00:00Z'),
      }),
      subscription({ id: 'paused', status: 'PAUSED' }),
      subscription({ id: 'done', status: 'COMPLETED' }),
      subscription({ id: 'abandoned', status: 'ABANDONED' }),
    ]);
    expect((await service.today(ACTOR))?.subscriptionId).toBe('sub-2');
    expect(await service.today(ACTOR, 'sub-1')).toMatchObject({
      subscriptionId: 'sub-1',
      day: { dayIndex: 7 },
    });
    expect((await service.today(ACTOR, 'paused'))?.status).toBe('PAUSED');
    expect((await service.today(ACTOR, 'done'))?.status).toBe('COMPLETED');
    await expect(service.today(ACTOR, 'abandoned')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns an empty overview and null default reading for a new member', async () => {
    const { service } = setup([]);
    expect(await service.subscriptions(ACTOR)).toEqual([]);
    expect(await service.today(ACTOR)).toBeNull();
  });

  it.each(['missing', 'other-member', 'other-tenant'])(
    'hides %s subscriptions across reads and writes',
    async (id) => {
      const { service } = setup([
        subscription({ id: 'other-member', profileId: 'profile-2' }),
        subscription({ id: 'other-tenant', tenantId: 'tenant-2' }),
      ]);
      await expect(service.today(ACTOR, id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.completeDay(ACTOR, id, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.uncompleteDay(ACTOR, id, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        service.update(ACTOR, id, { status: 'PAUSED' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.completedDays(ACTOR, id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    },
  );
});

describe('completion isolation and history', () => {
  it('does not record a new reading while that plan is paused', async () => {
    const { service, daysFor } = setup([
      subscription({ id: 'paused', status: 'PAUSED' }),
      subscription({ id: 'active', planId: 'plan-2' }),
    ]);

    await expect(service.completeDay(ACTOR, 'paused', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(daysFor('paused').size).toBe(0);
  });

  it('does not record progress for abandoned history', async () => {
    const { service, daysFor } = setup([
      subscription({ id: 'abandoned', status: 'ABANDONED' }),
    ]);

    await expect(
      service.completeDay(ACTOR, 'abandoned', 1),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(daysFor('abandoned').size).toBe(0);
  });

  it('keeps completions and undos isolated from other active plans', async () => {
    const other = subscription({
      id: 'sub-2',
      planId: 'plan-2',
      completedDays: 1,
      currentDayIndex: 2,
    });
    const { service, subscriptions, daysFor } = setup([subscription(), other], {
      'sub-2': [1],
    });
    await service.completeDay(ACTOR, 'sub-1', 1);
    await service.uncompleteDay(ACTOR, 'sub-1', 1);
    expect(daysFor('sub-1').size).toBe(0);
    expect([...daysFor('sub-2')]).toEqual([1]);
    expect(subscriptions.get('sub-2')).toEqual(other);
  });

  it('finishes only after all days are read and reopens on undo', async () => {
    const { service, subscriptions } = setup([
      subscription({ Plan: { durationDays: 3 } }),
    ]);
    expect((await service.completeDay(ACTOR, 'sub-1', 3)).status).toBe(
      'ACTIVE',
    );
    await service.completeDay(ACTOR, 'sub-1', 1);
    expect(await service.completeDay(ACTOR, 'sub-1', 2)).toMatchObject({
      status: 'COMPLETED',
      currentDayIndex: 3,
      completedDays: 3,
    });
    expect(subscriptions.get('sub-1')?.completedAt).toBeInstanceOf(Date);
    await service.uncompleteDay(ACTOR, 'sub-1', 1);
    expect(subscriptions.get('sub-1')).toMatchObject({
      status: 'ACTIVE',
      completedAt: null,
      currentDayIndex: 1,
      completedDays: 2,
    });
  });

  it('preserves a newer active reading when undoing completed history of that plan', async () => {
    const { service, subscriptions } = setup(
      [
        subscription({
          status: 'COMPLETED',
          Plan: { durationDays: 3 },
          completedDays: 3,
          currentDayIndex: 3,
        }),
        subscription({ id: 'new-reading' }),
      ],
      { 'sub-1': [1, 2, 3] },
    );
    await service.uncompleteDay(ACTOR, 'sub-1', 3);
    expect(subscriptions.get('sub-1')).toMatchObject({
      status: 'PAUSED',
      completedDays: 2,
    });
    expect(subscriptions.get('new-reading')?.status).toBe('ACTIVE');
  });

  it('retains all completed day indexes for plans longer than 400 days', async () => {
    const days = Array.from({ length: 500 }, (_, index) => index + 1);
    const { service, prisma } = setup(
      [subscription({ Plan: { durationDays: 500 } })],
      { 'sub-1': days },
    );
    expect(
      (await service.completedDays(ACTOR, 'sub-1')).dayIndexes,
    ).toHaveLength(500);
    expect(
      prisma.memberPlanProgress.findMany.mock.calls[0][0],
    ).not.toHaveProperty('take');
  });

  it.each([0, 91, 1.5])(
    'refuses invalid day %s for completion and undo',
    async (day) => {
      const { service } = setup();
      await expect(
        service.completeDay(ACTOR, 'sub-1', day),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.uncompleteDay(ACTOR, 'sub-1', day),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
