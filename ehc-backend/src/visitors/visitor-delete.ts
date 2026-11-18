import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

type Tx = Prisma.TransactionClient;

/** What a delete removed, for the audit trail and the reply. */
export interface DeletedVisitor {
  id: string;
  name: string;
  photoKey: string | null;
  removed: { followUpRecords: number; notes: number; visits: number; messages: number; formSubmissions: number };
}

/** Fields never copied into the audit trail: a prayer request stays with the pastors. */
const PRIVATE = new Set(['prayerPoint']);

/**
 * Deletes a first-timer for good, inside the caller's transaction: their form,
 * their follow-up record and its history, the team's conversation about them,
 * their visits, the messages sent to them, their approvals and their raw form
 * submission. Bookings and other forms that pointed at them are unlinked, not
 * deleted. A copy of their details (never the prayer request) goes to the
 * audit trail with who deleted them. Returns null when there is nobody to delete.
 */
export async function deleteVisitor(tx: Tx, tenantId: string, id: string, actorUserId: string | null): Promise<DeletedVisitor | null> {
  const visitor = await tx.visitor.findFirst({ where: { id, tenantId } });
  if (!visitor) return null;
  const entryIds = (await tx.followUpEntry.findMany({ where: { tenantId, visitorId: id }, select: { id: true } })).map((e) => e.id);
  const subject = { tenantId, subjectKind: 'VISITOR', subjectId: id };

  await tx.followUpStageHistory.deleteMany({ where: { entryId: { in: entryIds } } });
  await tx.approvalRequest.deleteMany({ where: { tenantId, subjectId: id } });
  const followUpRecords = (await tx.followUpEntry.deleteMany({ where: { id: { in: entryIds } } })).count;
  const notes = (await tx.followUpNote.deleteMany({ where: subject })).count;
  await tx.followUpNoteRead.deleteMany({ where: subject });
  await tx.followUpStatusChange.deleteMany({ where: subject });
  const messages = (await tx.messageLog.deleteMany({ where: { tenantId, visitorId: id } })).count;
  const visits = await tx.firstTimerVisit.count({ where: { visitorId: id } });
  await tx.pastoralBooking.updateMany({ where: { visitorId: id }, data: { visitorId: null } });
  await tx.visitor.updateMany({ where: { tenantId, possibleReturnVisitorId: id }, data: { possibleReturnVisitorId: null } });

  // The raw form they filled in: same day, same phone (last 10 digits) or email.
  const digits = (visitor.phone ?? '').replace(/\D/g, '').slice(-10);
  const formSubmissions = await tx.$executeRaw(Prisma.sql`
    DELETE FROM "FormSubmission"
     WHERE "tenantId" = ${tenantId} AND type = 'first_timer'
       AND "submittedAt" BETWEEN ${new Date(visitor.submittedAt.getTime() - 6 * 3600_000)} AND ${new Date(visitor.submittedAt.getTime() + 6 * 3600_000)}
       AND (
         (${digits} <> '' AND right(regexp_replace(COALESCE(data->>'phone_number', ''), '\\D', '', 'g'), 10) = ${digits})
         OR (${visitor.email ?? ''} <> '' AND lower(data->>'email') = lower(${visitor.email ?? ''}))
       )`);

  await tx.visitor.delete({ where: { id } });

  const name = `${visitor.firstName} ${visitor.lastName}`.trim();
  const removed = { followUpRecords, notes, visits, messages, formSubmissions };
  const snapshot = Object.fromEntries(Object.entries(visitor).filter(([k]) => !PRIVATE.has(k)));
  await tx.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorId: actorUserId,
      action: 'DELETE',
      entity: 'Visitor',
      entityId: id,
      before: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
      after: { deleted: true, removed },
    },
  });
  return { id, name, photoKey: visitor.photoKey, removed };
}
