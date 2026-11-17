import type { PipelineRow } from '../../pipeline/pipeline.types';
import type { DeciderLevel } from './approval-deciders';

/** One approval request as the profile and the queue show it. */
export interface ApprovalView {
  id: string;
  kind: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'CANCELLED';
  subjectId: string;
  unitId: string;
  unitName: string | null;
  note: string | null;
  requesterName: string | null;
  createdAt: string;
  decidedAt: string | null;
  deciderName: string | null;
  decisionNote: string | null;
  adminOverride: boolean;
  /** For an assignment: who the first-timer would go to. */
  proposedAssignee: { memberId: string; name: string | null } | null;
}

/** A request still waiting on someone, and whether the caller may decide it. */
export interface PendingDecision extends ApprovalView {
  canDecide: boolean;
  asOverride: boolean;
}

/** The approval part of a first-timer's profile. */
export interface SubjectApproval {
  /** The latest integration request. */
  latest: ApprovalView | null;
  canRequest: boolean;
  /** Why nobody can ask right now (not assigned, already integrated); null when someone can. */
  blocked: string | null;
  /** Set while an integration request is pending: who decides it. Names only for the team leads. */
  deciders: { level: DeciderLevel; names: string[] } | null;
  canDecide: boolean;
  /** The caller would be deciding as an admin in place of the team leads: flagged and audited. */
  decideAsOverride: boolean;
  /** Who they should go to, waiting for the team leads. */
  assignment?: PendingDecision | null;
  /** Integrated with no account yet, waiting for an admin. */
  account?: PendingDecision | null;
}

/** A pending request the caller may decide. */
export interface QueueItem extends ApprovalView {
  asOverride: boolean;
  person: PipelineRow;
}
