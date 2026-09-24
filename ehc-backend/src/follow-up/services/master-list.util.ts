import { MemberStatus } from '@prisma/client';

/** How someone reads on the Master List. */
export type MasterListStatus =
  | 'FIRST_TIMER'
  | 'SECOND_TIMER'
  | 'THIRD_TIMER'
  | 'INTEGRATED'
  | 'AWAY'
  | 'OPTED_OUT';

export interface MasterListRow {
  /** Member.id, or Visitor.id for a first-timer with no account yet. */
  id: string;
  kind: 'MEMBER' | 'VISITOR';
  name: string;
  photoUrl: string | null;
  assignedTo: { id: string; name: string } | null;
  status: MasterListStatus;
  /** False for a first-timer nobody has created an account for yet. */
  hasAccount: boolean;
  /** Services attended — what first/second/third timer is counted from. */
  attended: number;
  /** When they came to the church's notice: the form they filled in, or the day they joined. */
  since: string;
  /** When their most recent follow-up entry was opened, if they have one. */
  latestEntryAt: string | null;
}

/** Outcomes that mean this person has settled in with the church. */
const INTEGRATED_OUTCOMES = ['WANT_TO_BE_MEMBER', 'BECAME_MEMBER', 'RETURNED'];

/**
 * Where a member stands, most decisive fact first: they asked not to be
 * contacted; an outcome says they've settled; they're being followed up for
 * being away; otherwise how many times they have actually been here.
 */
export function memberStatusFor(
  memberStatus: MemberStatus,
  attended: number,
  sourceType: string | null,
  outcome: string | null,
): MasterListStatus {
  if (memberStatus === MemberStatus.OPTED_OUT) return 'OPTED_OUT';
  if (outcome && INTEGRATED_OUTCOMES.includes(outcome)) return 'INTEGRATED';
  if (sourceType === 'ABSENTEE') return 'AWAY';
  if (attended <= 1) return 'FIRST_TIMER';
  if (attended === 2) return 'SECOND_TIMER';
  if (attended === 3) return 'THIRD_TIMER';
  return 'INTEGRATED';
}

export function personName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`.trim();
}
