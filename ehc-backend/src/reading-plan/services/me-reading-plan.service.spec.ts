import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MeReadingPlanService } from './me-reading-plan.service';
import { PlanProgressRepository } from './plan-progress.repository';
import type { AuthUser } from '../../auth/types/auth-user';

/**
 * Section 14, test 3 of the specification: completion is idempotent, so the
 * same PUT five times yields completedDays = 1.
 *
 * That property is what lets the offline queue in Section 10 replay blindly.
 * Addressing the mutation by the day it affects rather than by "complete next"
 * is the whole reason it holds.
 */
const ACTOR = { profileId: 'profile-1' } as AuthUser;

function makeService(options: {
  subscription?: Record<string, unknown> | null;
  /** Day indexes already recorded as complete. */
  completed?: number[];
}) {
  const completed = new Set(options.completed ?? []);
  const subscription = options.subscription === undefined ? baseSubscription() : options.subscription;
  const updates: Record<string, unknown>[] = [];

  const tx = {
    memberPlanProgress: {
      createMany: jest.fn(async ({ data }: { data: { dayIndex: number }[] }) => {
        const day = data[0].dayIndex;
        if (completed.has(day)) return { count: 0 };
        completed.add(day);
        return { count: 1 };
      }),
      count: jest.fn(async () => completed.size),
      deleteMany: jest.fn(async ({ where }: { where: { dayIndex: number } }) => {
        const had = completed.delete(where.dayIndex);
        return { count: had ? 1 : 0 };
      }),
    },
    memberPlanSubscription: {
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { id: 'sub-1', ...data };
      }),
    },
  };

  const prisma = {
    memberPlanSubscription: {
      findFirst: jest.fn(async () => subscription),
      findUnique: jest.fn(async () => ({
        id: 'sub-1',
        currentDayIndex: 1,
        completedDays: completed.size,
        currentStreak: 1,
        longestStreak: 1,
        status: 'ACTIVE',
      })),
    },
    readingPlanPortion: { count: jest.fn(async () => 2) },
    $transaction: jest.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(tx)),
  };

  const service = new MeReadingPlanService(
    prisma as never,
    new PlanProgressRepository(prisma as never),
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );

  return { service, prisma, tx, updates, completed };
}

function baseSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    tenantId: 'tenant-1',
    profileId: 'profile-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    timezone: 'Africa/Lagos',
    currentDayIndex: 1,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadOn: null,
    graceUsedOn: null,
    startedOn: new Date('2026-09-01T00:00:00Z'),
    Plan: { durationDays: 90 },
    ...overrides,
  };
}

describe('completing a day', () => {
  it('is idempotent: the same request five times leaves one completed day', async () => {
    const { service, completed, updates } = makeService({});

    for (let i = 0; i < 5; i += 1) {
      await service.completeDay(ACTOR, 'sub-1', 1);
    }

    expect(completed.size).toBe(1);
    // Only the first request wrote to the subscription. The other four are
    // no-ops, so the streak cannot be advanced five times for one day's reading.
    expect(updates).toHaveLength(1);
  });

  it('reports a replayed request as already complete, with the same state', async () => {
    const { service } = makeService({});

    const first = await service.completeDay(ACTOR, 'sub-1', 1);
    const replay = await service.completeDay(ACTOR, 'sub-1', 1);

    expect(first.alreadyComplete).toBe(false);
    expect(replay.alreadyComplete).toBe(true);
    expect(replay.completedDays).toBe(first.completedDays);
  });

  it('advances the day index to the day after the last completed one', async () => {
    const { service, updates } = makeService({ completed: [1, 2] });

    await service.completeDay(ACTOR, 'sub-1', 3);

    expect(updates[0]).toMatchObject({ completedDays: 3, currentDayIndex: 4 });
  });

  it('marks the plan finished on the final day', async () => {
    const { service, updates } = makeService({
      subscription: baseSubscription({ Plan: { durationDays: 3 }, completedDays: 2 }),
      completed: [1, 2],
    });

    await service.completeDay(ACTOR, 'sub-1', 3);

    expect(updates[0]).toMatchObject({ status: 'COMPLETED', currentDayIndex: 3 });
    expect(updates[0].completedAt).toBeInstanceOf(Date);
  });

  it('starts the streak at one and records the member local date', async () => {
    const { service, updates } = makeService({});

    await service.completeDay(ACTOR, 'sub-1', 1);

    expect(updates[0].currentStreak).toBe(1);
    expect(updates[0].longestStreak).toBe(1);
    expect(updates[0].lastReadOn).toBeInstanceOf(Date);
  });

  it('refuses a day outside the plan', async () => {
    const { service } = makeService({});

    await expect(service.completeDay(ACTOR, 'sub-1', 0)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.completeDay(ACTOR, 'sub-1', 91)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses a subscription belonging to somebody else', async () => {
    // The repository answers not found for another member's id, so a member
    // cannot probe for subscriptions that are not theirs.
    const { service } = makeService({ subscription: null });

    await expect(service.completeDay(ACTOR, 'someone-else', 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('undoing a completion', () => {
  it('removes the day and steps the index back', async () => {
    const { service, completed } = makeService({ completed: [1, 2, 3] });

    const result = await service.uncompleteDay(ACTOR, 'sub-1', 3);

    expect(result.removed).toBe(true);
    expect(completed.has(3)).toBe(false);
    expect(result.completedDays).toBe(2);
    expect(result.currentDayIndex).toBe(3);
  });

  it('is a no-op when the day was never completed', async () => {
    const { service } = makeService({ completed: [1] });

    const result = await service.uncompleteDay(ACTOR, 'sub-1', 5);

    expect(result.removed).toBe(false);
  });
});
