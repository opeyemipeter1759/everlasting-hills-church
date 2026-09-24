import type { PrismaService } from '../../prisma/prisma.service';
import type { MasterListStatus } from './master-list.util';

/** A status the team set by hand, and the day they set it. */
export interface AgreedStatus {
  status: MasterListStatus;
  at: Date;
}

/**
 * The statuses the team has set by hand, by person. Rows are read oldest
 * first, so a later change simply overwrites an earlier one and each person
 * ends up with their most recent word on the matter.
 */
export async function latestStatusByPerson(
  prisma: PrismaService,
  args: { tenantId: string; kind: string; ids: string[]; state: string },
): Promise<Map<string, AgreedStatus>> {
  const { tenantId, kind, ids, state } = args;
  if (ids.length === 0) return new Map();

  const rows = await prisma.followUpStatusChange.findMany({
    where: { tenantId, subjectKind: kind, subjectId: { in: ids }, state },
    orderBy: { requestedAt: 'asc' },
    select: { subjectId: true, toStatus: true, requestedAt: true },
  });
  return new Map(rows.map((r) => [r.subjectId, { status: r.toStatus as MasterListStatus, at: r.requestedAt }]));
}
