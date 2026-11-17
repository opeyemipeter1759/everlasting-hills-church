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
}

/** The approval part of a first-timer's profile. */
export interface SubjectApproval {
  latest: ApprovalView | null;
  canRequest: boolean;
  /** Why nobody can ask right now (not assigned, already integrated); null when someone can. */
  blocked: string | null;
  /** Set while a request is pending: who decides it. Names only for a lead or department head. */
  deciders: { level: DeciderLevel; names: string[] } | null;
  canDecide: boolean;
  /** The caller would be deciding as an admin in place of the lead: flagged and audited. */
  decideAsOverride: boolean;
}

/** A pending request the caller may decide. */
export interface QueueItem extends ApprovalView {
  asOverride: boolean;
  person: PipelineRow;
}
