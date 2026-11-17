import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FollowUpStage, Prisma } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import { ADMIN_PLUS } from '../follow-up.types';
import { entryForVisitor, setStage } from '../stage-transitions';
import { safeFirstName } from '../events/follow-up-events';

type Tx = Prisma.TransactionClient;

/** What every kind of approval knows about the thing being approved. */
export interface ApprovalSubject {
  subjectType: string;
  subjectId: string;
  /** The unit whose lead decides, copied onto the request. */
  unitId: string;
  /** Lock-screen safe. */
  firstName: string;
  /** Member id of whoever is working it, if anyone. */
  assigneeId: string | null;
  /** Why a request cannot be made right now; null when it can. */
  blocked: string | null;
}

export type Decision = 'APPROVED' | 'CHANGES_REQUESTED';

/**
 * One kind of approval. The table is generic; a new kind is one more handler
 * registered in APPROVAL_KINDS, never a new table.
 */
export interface ApprovalKindHandler {
  kind: string;
  subjectType: string;
  /** Loads the subject inside the transaction; throws NotFound when it is not on record. */
  subject(tx: Tx, tenantId: string, subjectId: string): Promise<ApprovalSubject>;
  /** The lock-screen safe name events carry. */
  firstName(tx: Tx, tenantId: string, subjectId: string): Promise<string>;
  /** Who may ask. */
  canRequest(actor: AuthUser, subject: ApprovalSubject): boolean;
  onRequested(tx: Tx, ctx: { tenantId: string; subjectId: string; actorId: string | null }): Promise<void>;
  onDecided(tx: Tx, ctx: { tenantId: string; subjectId: string; actorId: string | null; decision: Decision; note: string | null }): Promise<void>;
}

const isAdmin = (actor: AuthUser) => actor.effectiveRoles?.some((r) => ADMIN_PLUS.includes(r)) ?? false;

/** The v1 kind: the unit lead confirms a first-timer is integrated. */
export const firstTimerIntegration: ApprovalKindHandler = {
  kind: 'FIRST_TIMER_INTEGRATION',
  subjectType: 'VISITOR',

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

  async firstName(tx, tenantId, visitorId) {
    const visitor = await tx.visitor.findFirst({ where: { id: visitorId, tenantId }, select: { firstName: true } });
    return safeFirstName(visitor?.firstName);
  },

  canRequest(actor, subject) {
    return isAdmin(actor) || (!!actor.memberId && subject.assigneeId === actor.memberId);
  },

  async onRequested(tx, { tenantId, subjectId, actorId }) {
    const entry = await entryForVisitor(tx, subjectId);
    if (!entry) throw new BadRequestException('They are not in follow-up yet');
    await setStage(tx, { tenantId, entryId: entry.id, to: FollowUpStage.AWAITING_REVIEW, reason: 'REQUESTED', actorId });
  },

  async onDecided(tx, { tenantId, subjectId, actorId, decision, note }) {
    const entry = await entryForVisitor(tx, subjectId);
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
  },
};

/** Every kind the approvals service can handle. */
export const APPROVAL_KINDS: Record<string, ApprovalKindHandler> = {
  [firstTimerIntegration.kind]: firstTimerIntegration,
};
