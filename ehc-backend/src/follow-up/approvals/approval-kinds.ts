import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalRequest, FollowUpStage, Prisma } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import type { OutboxService } from '../../outbox/outbox.service';
import { ADMIN_PLUS } from '../follow-up.types';
import { entryForVisitor, setStage } from '../stage-transitions';
import { safeFirstName } from '../events/follow-up-events';
import { memberAccount, requestMemberAccount } from './account-approval';
import { firstTimerAssignment } from './assignment-approval';
import { visitorFirstName } from './visitor-first-name';

type Tx = Prisma.TransactionClient;

/** What every kind of approval knows about the thing being approved. */
export interface ApprovalSubject {
  subjectType: string;
  subjectId: string;
  /** The unit whose team leads decide, copied onto the request. */
  unitId: string;
  /** Lock-screen safe. */
  firstName: string;
  /** Member id of whoever is working it, if anyone. */
  assigneeId: string | null;
  /** Why a request cannot be made right now; null when it can. */
  blocked: string | null;
}

export type Decision = 'APPROVED' | 'CHANGES_REQUESTED';

export interface DecideContext {
  tenantId: string;
  /** The request being decided, already marked with the decision. */
  request: ApprovalRequest;
  /** Profile id of whoever decided. */
  actorId: string | null;
  decision: Decision;
  note: string | null;
  /** For an assignment: someone other than the person proposed. */
  assigneeId?: string | null;
  outbox: OutboxService;
}

/**
 * One kind of approval. The table is generic; a new kind is one more handler
 * registered in APPROVAL_KINDS, never a new table.
 */
export interface ApprovalKindHandler {
  kind: string;
  subjectType: string;
  /** Asking for changes needs a note saying what. */
  noteOnChanges: boolean;
  /** Whether the pastor, admins and the team hear about the decision (approval.decided). */
  announceDecision: boolean;
  /** Loads the subject inside the transaction; throws NotFound when it is not on record. */
  subject(tx: Tx, tenantId: string, subjectId: string): Promise<ApprovalSubject>;
  /** The lock-screen safe name events carry. */
  firstName(tx: Tx, tenantId: string, subjectId: string): Promise<string>;
  /** Who may ask through the API. Kinds the system raises answer false. */
  canRequest(actor: AuthUser, subject: ApprovalSubject): boolean;
  onRequested(tx: Tx, ctx: { tenantId: string; subjectId: string; actorId: string | null }): Promise<void>;
  /** Carries out the decision. Returns outbox events to dispatch once the transaction commits. */
  onDecided(tx: Tx, ctx: DecideContext): Promise<string[]>;
}

const isAdmin = (actor: AuthUser) => actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r)) ?? false;

/** The team leads confirm a first-timer is integrated. */
export const firstTimerIntegration: ApprovalKindHandler = {
  kind: 'FIRST_TIMER_INTEGRATION',
  subjectType: 'VISITOR',
  noteOnChanges: true,
  announceDecision: true,

  async subject(tx, tenantId, visitorId) {
    const visitor = await tx.visitor.findFirst({ where: { id: visitorId, tenantId, archivedAt: null }, select: { id: true, firstName: true } });
    if (!visitor) throw new NotFoundException('First-timer not found');
    const entry = await entryForVisitor(tx, visitorId);
    let blocked: string | null = null;
    if (!entry) blocked = 'They are not in follow-up yet';
    else if (!entry.assigneeId) blocked = 'Assign them to someone before asking for approval';
    else if (entry.stage === FollowUpStage.CONFIRMED) blocked = 'They are already integrated';
    else if (entry.stage === FollowUpStage.OPTED_OUT) blocked = 'They have opted out';
    return {
      subjectType: 'VISITOR',
      subjectId: visitor.id,
      unitId: entry?.unitId ?? '',
      firstName: safeFirstName(visitor.firstName),
      assigneeId: entry?.assigneeId ?? null,
      blocked,
    };
  },

  firstName: visitorFirstName,

  canRequest(actor, subject) {
    return isAdmin(actor) || (!!actor.memberId && subject.assigneeId === actor.memberId);
  },

  async onRequested(tx, { tenantId, subjectId, actorId }) {
    const entry = await entryForVisitor(tx, subjectId);
    if (!entry) throw new BadRequestException('They are not in follow-up yet');
    await setStage(tx, { tenantId, entryId: entry.id, to: FollowUpStage.AWAITING_REVIEW, reason: 'REQUESTED', actorId });
  },

  async onDecided(tx, { tenantId, request, actorId, decision, note, outbox }) {
    const entry = await entryForVisitor(tx, request.subjectId);
    if (!entry) throw new BadRequestException('They are not in follow-up any more');
    // Opted out (or deactivated) while the request waited: a decision must not undo that.
    if (entry.stage === FollowUpStage.OPTED_OUT) throw new BadRequestException('They have opted out, so this can no longer be decided');
    const approved = decision === 'APPROVED';
    await setStage(tx, {
      tenantId,
      entryId: entry.id,
      to: approved ? FollowUpStage.CONFIRMED : FollowUpStage.REOPENED,
      reason: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
      actorId,
    });
    // The note goes back to the assignee with the entry, so it is in front of whoever picks them up next.
    if (note) await tx.followUpEntry.update({ where: { id: entry.id }, data: { reviewNote: note } });
    if (!approved) return [];
    // Integrated and still without an account: the admins are asked to make one.
    const asked = await requestMemberAccount(tx, outbox, { tenantId, visitorId: request.subjectId, unitId: request.unitId, requesterId: actorId });
    return asked ? [asked] : [];
  },
};

/** Every kind the approvals service can handle. */
export const APPROVAL_KINDS: Record<string, ApprovalKindHandler> = {
  [firstTimerIntegration.kind]: firstTimerIntegration,
  [firstTimerAssignment.kind]: firstTimerAssignment,
  [memberAccount.kind]: memberAccount,
};
