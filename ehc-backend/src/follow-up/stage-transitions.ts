import { FollowUpStage, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

type Tx = Prisma.TransactionClient;

/** The stages a first-timer is still being worked in. */
export const WORKING: FollowUpStage[] = [FollowUpStage.ASSIGNED, FollowUpStage.IN_PROGRESS, FollowUpStage.REOPENED];

export interface StageChange {
  tenantId: string;
  entryId: string;
  to: FollowUpStage;
  /** DEACTIVATED, REACTIVATED, OPTED_OUT, RESTORED, ASSIGNED, CONTACTED, REQUESTED, APPROVED, CHANGES_REQUESTED, CANCELLED, BACKFILL */
  reason: string;
  /** Profile id of whoever made the change. */
  actorId?: string | null;
}

/**
 * Moves a follow-up entry to a new stage and writes the history row, inside
 * the caller's transaction. Every stage change goes through here, so the
 * history is complete and an opt-out can always be undone to the stage before
 * it. A change to the stage it already has writes nothing.
 */
export async function setStage(tx: Tx, change: StageChange): Promise<{ from: FollowUpStage | null; changed: boolean }> {
  const entry = await tx.followUpEntry.findUnique({ where: { id: change.entryId }, select: { stage: true } });
  if (!entry) throw new Error(`Follow-up entry ${change.entryId} not found`);
  if (entry.stage === change.to) return { from: entry.stage, changed: false };

  await tx.followUpEntry.update({ where: { id: change.entryId }, data: { stage: change.to } });
  await tx.followUpStageHistory.create({
    data: {
      id: randomUUID(),
      tenantId: change.tenantId,
      entryId: change.entryId,
      fromStage: entry.stage,
      toStage: change.to,
      reason: change.reason,
      actorId: change.actorId ?? null,
    },
  });
  return { from: entry.stage, changed: true };
}

/**
 * The stage someone had before they were last opted out, from the history.
 * Falls back to ASSIGNED or UNASSIGNED by whether anyone has them, for entries
 * opted out before history was kept.
 */
export async function stageBeforeOptOut(tx: Tx, entryId: string): Promise<FollowUpStage> {
  const last = await tx.followUpStageHistory.findFirst({
    where: { entryId, toStage: FollowUpStage.OPTED_OUT },
    orderBy: { createdAt: 'desc' },
    select: { fromStage: true },
  });
  if (last?.fromStage && last.fromStage !== FollowUpStage.OPTED_OUT) return last.fromStage;
  const entry = await tx.followUpEntry.findUnique({ where: { id: entryId }, select: { assigneeId: true } });
  return entry?.assigneeId ? FollowUpStage.ASSIGNED : FollowUpStage.UNASSIGNED;
}

/** The follow-up entry of a first-timer, through their visitor record or the account made from it. */
export async function entryForVisitor(tx: Tx, visitorId: string) {
  const visitor = await tx.visitor.findUnique({ where: { id: visitorId }, select: { convertedToMemberId: true } });
  const member = visitor?.convertedToMemberId;
  return tx.followUpEntry.findFirst({
    where: { OR: [{ visitorId }, ...(member ? [{ memberId: member }] : [])] },
    orderBy: { updatedAt: 'desc' },
  });
}
