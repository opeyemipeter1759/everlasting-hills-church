import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, FollowUpStage, MemberStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { OutboxService } from '../../outbox/outbox.service';
import { entryForVisitor } from '../stage-transitions';
import { assignEntry } from '../routing/assignment';
import { FollowUpEvent, safeFirstName, type ApprovalRequestedPayload } from '../events/follow-up-events';
import type { ApprovalKindHandler } from './approval-kinds';
import { visitorFirstName } from './visitor-first-name';

type Tx = Prisma.TransactionClient;

export const FIRST_TIMER_ASSIGNMENT = 'FIRST_TIMER_ASSIGNMENT';
/** The requester of an assignment the routing rules proposed: no person asked. */
export const ROUTING_REQUESTER = 'routing';

/** What an assignment request carries beyond its subject. */
export interface AssignmentPayload {
  /** Member id of the person proposed. */
  assigneeId: string;
  /** The rule that proposed them, when one did. */
  routingRuleId: string | null;
}

export function assignmentPayload(payload: Prisma.JsonValue | null | undefined): AssignmentPayload | null {
  const p = payload as Partial<AssignmentPayload> | null | undefined;
  return p && typeof p.assigneeId === 'string' ? { assigneeId: p.assigneeId, routingRuleId: p.routingRuleId ?? null } : null;
}

/**
 * The unit's team leads approve who a new first-timer goes to. The routing
 * rules (or the unit's auto-assign) propose someone; until a lead approves,
 * the first-timer stays unassigned. A lead can approve the person proposed,
 * give them to someone else in the unit, or leave them unassigned to place by
 * hand. Assigning by hand is already a team lead's or an admin's act, so it
 * needs no approval.
 */
export const firstTimerAssignment: ApprovalKindHandler = {
  kind: FIRST_TIMER_ASSIGNMENT,
  subjectType: 'VISITOR',
  noteOnChanges: false,
  announceDecision: false,

  async subject(tx, tenantId, visitorId) {
    const visitor = await tx.visitor.findFirst({ where: { id: visitorId, tenantId, archivedAt: null }, select: { id: true, firstName: true } });
    if (!visitor) throw new NotFoundException('First-timer not found');
    const entry = await entryForVisitor(tx, visitorId);
    return {
      subjectType: 'VISITOR',
      subjectId: visitor.id,
      unitId: entry?.unitId ?? '',
      firstName: safeFirstName(visitor.firstName),
      assigneeId: entry?.assigneeId ?? null,
      blocked: entry ? null : 'They are not in follow-up yet',
    };
  },

  firstName: visitorFirstName,

  // Proposed by the routing rules, never asked for by hand.
  canRequest: () => false,

  async onRequested() {},

  async onDecided(tx, { tenantId, request, actorId, decision, assigneeId: chosen, outbox }) {
    // "Leave unassigned": nothing changes, and the team leads place them by hand.
    if (decision !== 'APPROVED') return [];
    const proposed = assignmentPayload(request.payload);
    const assigneeId = chosen || proposed?.assigneeId;
    if (!assigneeId) throw new BadRequestException('Pick who they go to');

    const entry = await entryForVisitor(tx, request.subjectId);
    if (!entry) throw new BadRequestException('They are not in follow-up any more');
    if (entry.stage === FollowUpStage.OPTED_OUT) throw new BadRequestException('They have opted out, so this can no longer be decided');
    if (entry.stage === FollowUpStage.CONFIRMED) throw new BadRequestException('They are already integrated');
    const inUnit = await tx.unitMember.findFirst({
      where: { tenantId, unitId: request.unitId, memberId: assigneeId, Member: { status: MemberStatus.ACTIVE } },
      select: { id: true },
    });
    if (!inUnit) throw new BadRequestException('That person is not an active member of this unit');

    const result = await assignEntry(tx, outbox, {
      tenantId,
      entryId: entry.id,
      assigneeId,
      unitId: request.unitId,
      routingRuleId: assigneeId === proposed?.assigneeId ? proposed.routingRuleId : null,
      actorId,
    });
    return result.eventId ? [result.eventId] : [];
  },
};

/**
 * Proposes who a new first-timer goes to, inside the caller's transaction, and
 * tells the unit's team leads. Nothing is assigned until one of them approves.
 * Returns the outbox event to dispatch, or null when a proposal is already
 * waiting for this person.
 */
export async function proposeAssignment(
  tx: Tx,
  outbox: OutboxService,
  input: {
    tenantId: string;
    visitorId: string;
    firstName: string;
    unitId: string;
    assigneeId: string;
    routingRuleId: string | null;
    /** Profile id of whoever captured them, or ROUTING_REQUESTER. */
    requesterId: string;
  },
): Promise<string | null> {
  const waiting = await tx.approvalRequest.findFirst({
    where: { tenantId: input.tenantId, kind: FIRST_TIMER_ASSIGNMENT, subjectId: input.visitorId, status: ApprovalStatus.PENDING },
    select: { id: true },
  });
  if (waiting) return null;

  const id = randomUUID();
  const payload: AssignmentPayload = { assigneeId: input.assigneeId, routingRuleId: input.routingRuleId };
  await tx.approvalRequest.create({
    data: {
      id, tenantId: input.tenantId, kind: FIRST_TIMER_ASSIGNMENT, subjectType: 'VISITOR', subjectId: input.visitorId,
      unitId: input.unitId, requesterId: input.requesterId, payload: { ...payload },
    },
  });
  const assignee = await tx.member.findUnique({ where: { id: input.assigneeId }, select: { firstName: true } });
  const event: ApprovalRequestedPayload = {
    approvalId: id, kind: FIRST_TIMER_ASSIGNMENT, visitorId: input.visitorId, firstName: safeFirstName(input.firstName),
    unitId: input.unitId, requesterId: input.requesterId, assigneeName: safeFirstName(assignee?.firstName),
  };
  const actorId = input.requesterId === ROUTING_REQUESTER ? null : input.requesterId;
  return outbox.record(tx, { tenantId: input.tenantId, type: FollowUpEvent.ApprovalRequested, payload: { ...event }, actorId });
}
