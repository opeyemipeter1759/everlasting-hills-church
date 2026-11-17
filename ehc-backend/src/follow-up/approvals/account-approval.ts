import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { OutboxService } from '../../outbox/outbox.service';
import { entryForVisitor } from '../stage-transitions';
import { FollowUpEvent, safeFirstName, type ApprovalRequestedPayload } from '../events/follow-up-events';
import type { ApprovalKindHandler } from './approval-kinds';
import { visitorFirstName } from './visitor-first-name';

type Tx = Prisma.TransactionClient;

export const MEMBER_ACCOUNT = 'MEMBER_ACCOUNT';

/**
 * The admins are asked to create a member account for someone just integrated.
 * The request is raised by the integration approval and answered by creating
 * the account (Administration, First Timers), which marks it done; an admin
 * can also set it aside with "Not now".
 */
export const memberAccount: ApprovalKindHandler = {
  kind: MEMBER_ACCOUNT,
  subjectType: 'VISITOR',
  noteOnChanges: false,
  announceDecision: false,

  async subject(tx, tenantId, visitorId) {
    const visitor = await tx.visitor.findFirst({
      where: { id: visitorId, tenantId, archivedAt: null },
      select: { id: true, firstName: true, convertedToMemberId: true },
    });
    if (!visitor) throw new NotFoundException('First-timer not found');
    const entry = await entryForVisitor(tx, visitorId);
    return {
      subjectType: 'VISITOR',
      subjectId: visitor.id,
      unitId: entry?.unitId ?? '',
      firstName: safeFirstName(visitor.firstName),
      assigneeId: entry?.assigneeId ?? null,
      blocked: visitor.convertedToMemberId ? 'They already have an account' : null,
    };
  },

  firstName: visitorFirstName,

  // Raised only by an integration approval, never asked for by hand.
  canRequest: () => false,

  async onRequested() {},

  async onDecided(tx, { tenantId, request, decision }) {
    if (decision !== 'APPROVED') return [];
    const visitor = await tx.visitor.findFirst({ where: { id: request.subjectId, tenantId }, select: { convertedToMemberId: true } });
    if (!visitor?.convertedToMemberId) throw new BadRequestException('Create their account first; this request then clears by itself');
    return [];
  },
};

/**
 * Asks the admins for an account, inside the caller's transaction, unless the
 * person has one already or the request is already waiting. Returns the outbox
 * event to dispatch, or null when nothing was asked.
 */
export async function requestMemberAccount(
  tx: Tx,
  outbox: OutboxService,
  input: { tenantId: string; visitorId: string; unitId: string; requesterId: string | null },
): Promise<string | null> {
  const visitor = await tx.visitor.findFirst({
    where: { id: input.visitorId, tenantId: input.tenantId, archivedAt: null },
    select: { firstName: true, convertedToMemberId: true },
  });
  if (!visitor || visitor.convertedToMemberId || !input.requesterId) return null;
  const waiting = await tx.approvalRequest.findFirst({
    where: { tenantId: input.tenantId, kind: MEMBER_ACCOUNT, subjectId: input.visitorId, status: ApprovalStatus.PENDING },
    select: { id: true },
  });
  if (waiting) return null;

  const id = randomUUID();
  await tx.approvalRequest.create({
    data: {
      id, tenantId: input.tenantId, kind: MEMBER_ACCOUNT, subjectType: 'VISITOR', subjectId: input.visitorId,
      unitId: input.unitId, requesterId: input.requesterId,
    },
  });
  const payload: ApprovalRequestedPayload = {
    approvalId: id, kind: MEMBER_ACCOUNT, visitorId: input.visitorId, firstName: safeFirstName(visitor.firstName),
    unitId: input.unitId, requesterId: input.requesterId,
  };
  return outbox.record(tx, { tenantId: input.tenantId, type: FollowUpEvent.ApprovalRequested, payload: { ...payload }, actorId: input.requesterId });
}

/** Creating the account answers the request for it. Returns how many were waiting. */
export async function resolveMemberAccount(tx: Tx, input: { tenantId: string; visitorId: string; actorId: string | null }): Promise<number> {
  const { count } = await tx.approvalRequest.updateMany({
    where: { tenantId: input.tenantId, kind: MEMBER_ACCOUNT, subjectId: input.visitorId, status: ApprovalStatus.PENDING },
    data: { status: ApprovalStatus.APPROVED, deciderId: input.actorId, decidedAt: new Date(), decisionNote: 'Account created' },
  });
  return count;
}
