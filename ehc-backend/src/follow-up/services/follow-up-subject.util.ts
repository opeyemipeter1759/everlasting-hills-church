import type { Prisma, PrismaClient } from '@prisma/client';

/** Who a Follow Up thread is about: a member or a first-timer. */
export interface FollowUpSubject {
  kind: string;
  id: string;
}

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Moves everything keyed to one person's thread onto another identity: the
 * messages, the requested status changes, and each team member's "read up
 * to" marker.
 *
 * These tables key a thread by (kind, id) with no foreign key, so when a
 * first-timer becomes a member nothing follows them automatically — the
 * Master List opens the member's (empty) thread and the conversation looks
 * lost. Run inside the conversion's transaction.
 */
export async function moveFollowUpThread(db: Db, tenantId: string, from: FollowUpSubject, to: FollowUpSubject) {
  const fromWhere = { tenantId, subjectKind: from.kind, subjectId: from.id };
  const target = { subjectKind: to.kind, subjectId: to.id };

  const notes = await db.followUpNote.updateMany({ where: fromWhere, data: target });
  const statusChanges = await db.followUpStatusChange.updateMany({ where: fromWhere, data: target });

  // One read marker per person per thread: keep the later of the two.
  const reads = await db.followUpNoteRead.findMany({ where: fromWhere });
  for (const read of reads) {
    const existing = await db.followUpNoteRead.findUnique({
      where: { profileId_subjectKind_subjectId: { profileId: read.profileId, ...target } },
    });
    if (!existing) {
      await db.followUpNoteRead.update({ where: { id: read.id }, data: target });
      continue;
    }
    if (read.lastReadAt > existing.lastReadAt) {
      await db.followUpNoteRead.update({ where: { id: existing.id }, data: { lastReadAt: read.lastReadAt } });
    }
    await db.followUpNoteRead.delete({ where: { id: read.id } });
  }

  return { notes: notes.count, statusChanges: statusChanges.count, reads: reads.length };
}

/**
 * The identity a thread lives under now. A first-timer converted to a member
 * is followed up as that member, so links and notifications that still name
 * the visitor (sent before the conversion) open the member's thread.
 */
export async function currentSubject(db: Db, tenantId: string, subject: FollowUpSubject): Promise<FollowUpSubject> {
  if (subject.kind !== 'VISITOR') return subject;
  const visitor = await db.visitor.findFirst({
    where: { id: subject.id, tenantId },
    select: { convertedToMemberId: true },
  });
  return visitor?.convertedToMemberId ? { kind: 'MEMBER', id: visitor.convertedToMemberId } : subject;
}
