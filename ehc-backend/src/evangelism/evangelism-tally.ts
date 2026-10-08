import type { PrismaService } from '../prisma/prisma.service';
import { startOfLagosYear } from './evangelism-dates.util';

/** One member's evangelism record: counts only, never the people themselves. */
export interface EvangelismTally {
  /** Everyone recorded with this member as the worker who preached. */
  reached: number;
  /** Of those, how many gave their life to Christ. */
  saved: number;
  /** Of those, how many were already saved. */
  alreadySaved: number;
  thisYear: { reached: number; saved: number };
  lastContactDate: Date | null;
}

/**
 * Counted from contacts linked to the member. A name typed under "Other" on
 * the form is not linked to anyone, so it is not counted here.
 */
export async function evangelismTally(
  prisma: PrismaService,
  tenantId: string,
  memberId: string,
  now: Date = new Date(),
): Promise<EvangelismTally> {
  const where = { tenantId, workerMemberId: memberId };
  const [byStatus, thisYear, last] = await Promise.all([
    prisma.evangelismContact.groupBy({ by: ['savedStatus'], where, _count: { _all: true } }),
    prisma.evangelismContact.groupBy({
      by: ['savedStatus'],
      where: { ...where, contactDate: { gte: startOfLagosYear(now) } },
      _count: { _all: true },
    }),
    prisma.evangelismContact.findFirst({ where, orderBy: { contactDate: 'desc' }, select: { contactDate: true } }),
  ]);
  const count = (rows: typeof byStatus, status?: string) =>
    rows.filter((r) => !status || r.savedStatus === status).reduce((sum, r) => sum + r._count._all, 0);
  return {
    reached: count(byStatus),
    saved: count(byStatus, 'YES'),
    alreadySaved: count(byStatus, 'ALREADY'),
    thisYear: { reached: count(thisYear), saved: count(thisYear, 'YES') },
    lastContactDate: last?.contactDate ?? null,
  };
}
