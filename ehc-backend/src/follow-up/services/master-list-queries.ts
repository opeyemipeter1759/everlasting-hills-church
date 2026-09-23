import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { memberStatusFor, personName, type MasterListRow } from './master-list.util';

/** First-timers with no account yet — the newest arrivals first. */
export async function fetchVisitorRows(
  prisma: PrismaService,
  where: Prisma.VisitorWhereInput,
  take: number,
  skip: number,
): Promise<MasterListRow[]> {
  const rows = await prisma.visitor.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    take,
    skip,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      submittedAt: true,
      FollowUpEntry: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, Assignee: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  return rows.map((v) => {
    const entry = v.FollowUpEntry[0] ?? null;
    const assignee = entry?.Assignee ?? null;
    return {
      id: v.id,
      kind: 'VISITOR' as const,
      name: personName(v),
      photoUrl: null,
      assignedTo: assignee ? { id: assignee.id, name: personName(assignee) } : null,
      status: 'FIRST_TIMER' as const,
      hasAccount: false,
      attended: 0,
      since: v.submittedAt.toISOString(),
      latestEntryAt: entry ? entry.createdAt.toISOString() : null,
    };
  });
}

export async function fetchMemberRows(
  prisma: PrismaService,
  where: Prisma.MemberWhereInput,
  take: number,
  skip: number,
): Promise<MasterListRow[]> {
  const rows = await prisma.member.findMany({
    where,
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take,
    skip,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      status: true,
      joinedAt: true,
      _count: { select: { AttendanceRecord: { where: { present: true } } } },
      FollowUpAsSubject: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          createdAt: true,
          sourceType: true,
          outcome: true,
          Assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  return rows.map((m) => {
    const entry = m.FollowUpAsSubject[0] ?? null;
    const attended = m._count.AttendanceRecord;
    return {
      id: m.id,
      kind: 'MEMBER' as const,
      name: personName(m),
      photoUrl: m.photoUrl,
      assignedTo: entry?.Assignee ? { id: entry.Assignee.id, name: personName(entry.Assignee) } : null,
      status: memberStatusFor(m.status, attended, entry?.sourceType ?? null, entry?.outcome ?? null),
      hasAccount: true,
      attended,
      since: m.joinedAt.toISOString(),
      latestEntryAt: entry ? entry.createdAt.toISOString() : null,
    };
  });
}
