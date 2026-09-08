import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toDateColumn } from '../local-date.util';

/**
 * Every read and write of per day progress goes through here.
 *
 * Not because the queries are complicated, but because of where this ends up.
 * At roughly a million subscribers, a row per day per member is 365 million
 * rows a year. The move at that point is to collapse progress onto the
 * subscription row as a bitmap: a 365 day plan is 365 bits, 46 bytes, in a
 * bit varying column, turning 365 million rows into a million. That is
 * premature at ten thousand members and at a hundred thousand, so the row per
 * day model is what runs.
 *
 * The point of naming the escape hatch now is not to build it. It is to keep
 * every call site behind one class so the storage shape can change later
 * without touching any of them.
 */
@Injectable()
export class PlanProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a day as complete. Returns false when it was already recorded.
   *
   * Idempotent by construction: the unique index on (subscriptionId, dayIndex)
   * decides, not a prior read. A double tap, a retry, or an offline queue
   * replaying the same request all land on the same row.
   */
  async markComplete(input: {
    subscriptionId: string;
    tenantId: string;
    profileId: string;
    dayIndex: number;
    completedOn: string;
    portionsDone: number;
    tx?: Prisma.TransactionClient;
  }): Promise<boolean> {
    const client = input.tx ?? this.prisma;
    const created = await client.memberPlanProgress.createMany({
      data: [
        {
          id: randomUUID(),
          subscriptionId: input.subscriptionId,
          tenantId: input.tenantId,
          profileId: input.profileId,
          dayIndex: input.dayIndex,
          completedOn: toDateColumn(input.completedOn),
          portionsDone: input.portionsDone,
        },
      ],
      skipDuplicates: true,
    });
    return created.count === 1;
  }

  /** Undoes a completion. Returns false when there was nothing to undo. */
  async clearComplete(input: {
    subscriptionId: string;
    dayIndex: number;
    tx?: Prisma.TransactionClient;
  }): Promise<boolean> {
    const client = input.tx ?? this.prisma;
    const { count } = await client.memberPlanProgress.deleteMany({
      where: { subscriptionId: input.subscriptionId, dayIndex: input.dayIndex },
    });
    return count > 0;
  }

  async countCompleted(subscriptionId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    return client.memberPlanProgress.count({ where: { subscriptionId } });
  }

  /** Day indexes already completed, for rendering ticks against a day list. */
  async completedDayIndexes(subscriptionId: string, limit = 400): Promise<number[]> {
    const rows = await this.prisma.memberPlanProgress.findMany({
      where: { subscriptionId },
      select: { dayIndex: true },
      orderBy: { dayIndex: 'asc' },
      take: limit,
    });
    return rows.map((row) => row.dayIndex);
  }

  async isComplete(subscriptionId: string, dayIndex: number): Promise<boolean> {
    const row = await this.prisma.memberPlanProgress.findUnique({
      where: { subscriptionId_dayIndex: { subscriptionId, dayIndex } },
      select: { id: true },
    });
    return row !== null;
  }
}
