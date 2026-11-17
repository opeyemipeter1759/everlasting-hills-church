import { FollowUpStage, Prisma } from '@prisma/client';
import type { OutboxService } from '../../outbox/outbox.service';
import { setStage } from '../stage-transitions';
import { cancelPendingApprovals } from '../approvals/approval-cancel';
import { FollowUpEvent, safeFirstName, type AssignedPayload } from '../events/follow-up-events';

type Tx = Prisma.TransactionClient;

export interface AssignInput {
  tenantId: string;
  entryId: string;
  /** Member id of the new assignee. */
  assigneeId: string;
  /** The unit the assignment sits under: the rule's, or the one picked by hand. */
  unitId: string;
  /** Set when a routing rule made the assignment; a hand assignment clears it. */
  routingRuleId?: string | null;
  /** Profile id of whoever assigned; null for the routing rules. */
  actorId?: string | null;
  /** False for a bulk move, which tells the assignee once for the lot. */
  notify?: boolean;
}

export interface AssignResult {
  changed: boolean;
  /** The first-timer behind the entry, when it is one (their form, or the account made from it). */
  visitorId: string | null;
  firstName: string | null;
  /** Outbox event to dispatch once the transaction commits. */
  eventId: string | null;
  cancelledApprovals: number;
}

/** The form behind a follow-up entry: its own visitor, or the visitor whose account the entry now follows. */
export async function visitorOfEntry(tx: Tx, entry: { visitorId: string | null; memberId: string | null }) {
  const select = { id: true, firstName: true } as const;
  if (entry.visitorId) return tx.visitor.findUnique({ where: { id: entry.visitorId }, select });
  if (entry.memberId) return tx.visitor.findFirst({ where: { convertedToMemberId: entry.memberId }, select, orderBy: { submittedAt: 'asc' } });
  return null;
}

/**
 * Gives a follow-up entry to someone, inside the caller's transaction. Every
 * assignment goes through here, so each one records when it happened and the
 * unit it sits under, moves a new person into follow-up, cancels any approval
 * still pending (it was asked for under the old assignment), and records
 * `first_timer.assigned` for a first-timer. Giving someone the same person
 * under the same unit again changes nothing.
 */
export async function assignEntry(tx: Tx, outbox: OutboxService, input: AssignInput): Promise<AssignResult> {
  const entry = await tx.followUpEntry.findUnique({
    where: { id: input.entryId },
    select: { stage: true, assigneeId: true, unitId: true, visitorId: true, memberId: true },
  });
  if (!entry) throw new Error(`Follow-up entry ${input.entryId} not found`);
  const visitor = await visitorOfEntry(tx, entry);
  const who = { visitorId: visitor?.id ?? null, firstName: visitor ? safeFirstName(visitor.firstName) : null };
  if (entry.assigneeId === input.assigneeId && entry.unitId === input.unitId) {
    return { changed: false, ...who, eventId: null, cancelledApprovals: 0 };
  }

  await tx.followUpEntry.update({
    where: { id: input.entryId },
    data: { assigneeId: input.assigneeId, unitId: input.unitId, assignedAt: new Date(), routingRuleId: input.routingRuleId ?? null },
  });

  const cancelledApprovals = visitor
    ? await cancelPendingApprovals(tx, {
        tenantId: input.tenantId,
        subjectType: 'VISITOR',
        subjectId: visitor.id,
        actorId: input.actorId,
        note: 'Cancelled because they were reassigned.',
      })
    : 0;

  // New people move into follow-up; someone waiting on an approval that was just cancelled goes back to it.
  if (entry.stage === FollowUpStage.UNASSIGNED || entry.stage === FollowUpStage.AWAITING_REVIEW) {
    await setStage(tx, {
      tenantId: input.tenantId,
      entryId: input.entryId,
      to: FollowUpStage.ASSIGNED,
      reason: entry.stage === FollowUpStage.AWAITING_REVIEW ? 'CANCELLED' : 'ASSIGNED',
      actorId: input.actorId,
    });
  }

  let eventId: string | null = null;
  if (visitor && input.notify !== false) {
    const payload: AssignedPayload = {
      assigneeMemberId: input.assigneeId,
      visitorId: visitor.id,
      firstName: safeFirstName(visitor.firstName),
      entryId: input.entryId,
    };
    eventId = await outbox.record(tx, {
      tenantId: input.tenantId,
      type: FollowUpEvent.Assigned,
      payload: payload as unknown as Record<string, unknown>,
      actorId: input.actorId,
    });
  }
  return { changed: true, ...who, eventId, cancelledApprovals };
}

/**
 * The unit a hand assignment sits under: the one picked, when the assignee is
 * in it; else the entry's current unit, when the assignee is in it; else the
 * assignee's only unit; else Follow-Up, when they are in it; else their oldest
 * membership. Null when the picked unit is not one of theirs.
 */
export function pickAssignmentUnit(
  memberUnitIds: string[],
  o: { requested?: string | null; current: string; followUpUnitId?: string | null },
): string | null {
  if (o.requested) return memberUnitIds.includes(o.requested) ? o.requested : null;
  if (memberUnitIds.includes(o.current)) return o.current;
  if (memberUnitIds.length === 1) return memberUnitIds[0];
  if (o.followUpUnitId && memberUnitIds.includes(o.followUpUnitId)) return o.followUpUnitId;
  return memberUnitIds[0] ?? null;
}
