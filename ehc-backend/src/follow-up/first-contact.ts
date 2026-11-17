import { FollowUpSourceType, FollowUpStage, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { PrismaService } from '../prisma/prisma.service';
import { findFollowUpUnit } from './follow-up-unit.util';
import { entryForVisitor, setStage } from './stage-transitions';

type Tx = Prisma.TransactionClient;

export interface FirstContact {
  tenantId: string;
  visitorId: string;
  /** When the contact happened. */
  at: Date;
  /** Profile id of whoever made the contact; also records who added the entry when one has to be created. */
  actorId: string | null;
}

export interface FirstContactResult {
  /** True only for the first contact of any kind: this one set first_contacted_at. */
  stamped: boolean;
  entryId: string | null;
}

/**
 * Records a contact on someone's follow-up entry, inside the caller's
 * transaction. The first contact of any kind (an opening message, a call the
 * team logs) sets `firstContactedAt`, the 48-hour metric, and moves someone
 * still NEW (UNASSIGNED) into follow-up. Every later contact changes nothing.
 *
 * A first-timer with no entry yet gets one in the Follow-Up unit, because a
 * contact is often made before anyone is assigned.
 */
export async function stampFirstContact(tx: Tx, contact: FirstContact): Promise<FirstContactResult> {
  // Two sends for the same person at once must not both create an entry.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`first-contact:${contact.visitorId}`}))`;

  let entry = await entryForVisitor(tx, contact.visitorId);
  if (!entry) {
    const unit = await findFollowUpUnit(tx as unknown as PrismaService, contact.tenantId);
    if (!unit || !contact.actorId) return { stamped: false, entryId: null };
    entry = await tx.followUpEntry.create({
      data: {
        id: randomUUID(),
        tenantId: contact.tenantId,
        unitId: unit.id,
        sourceType: FollowUpSourceType.FIRST_TIMER,
        visitorId: contact.visitorId,
        addedById: contact.actorId,
        stage: FollowUpStage.UNASSIGNED,
      },
    });
  }
  return stampEntryFirstContact(tx, { ...contact, entryId: entry.id });
}

/**
 * The same, for a caller that already holds the entry (the team's contact log).
 * The conditional update is what makes "only the first" true under
 * concurrency: exactly one writer finds first_contacted_at still empty.
 */
export async function stampEntryFirstContact(
  tx: Tx,
  c: { tenantId: string; entryId: string; at: Date; actorId: string | null },
): Promise<FirstContactResult> {
  const { count } = await tx.followUpEntry.updateMany({
    where: { id: c.entryId, tenantId: c.tenantId, firstContactedAt: null },
    data: { firstContactedAt: c.at },
  });
  if (count === 0) return { stamped: false, entryId: c.entryId };
  const entry = await tx.followUpEntry.findUnique({ where: { id: c.entryId }, select: { stage: true } });
  if (entry?.stage === FollowUpStage.UNASSIGNED) {
    await setStage(tx, { tenantId: c.tenantId, entryId: c.entryId, to: FollowUpStage.IN_PROGRESS, reason: 'CONTACTED', actorId: c.actorId });
  }
  return { stamped: true, entryId: c.entryId };
}
