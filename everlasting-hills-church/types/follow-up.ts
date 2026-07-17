// Types for the Follow-Up Pipeline page (app/dashboard/follow-up). Mirrors the
// backend's FollowUpEntry/FollowUpContactLog response shape 1:1 — see
// ehc-backend/src/follow-up/follow-up.service.ts's mapEntry().

export type FollowUpStage =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_REVIEW"
  | "CONFIRMED"
  | "REOPENED";

export type FollowUpSourceType = "FIRST_TIMER" | "ABSENTEE";

export type FollowUpOutcome =
  // Current taxonomy, shown in the "Log Outcome" form.
  | "REACHABLE"
  | "UNREACHABLE"
  | "NOT_INTERESTED"
  | "TRAVEL"
  | "CAME_FOR_VISITING"
  | "HAVE_A_CHURCH"
  | "WANT_TO_BE_MEMBER"
  // Legacy — no longer logged, kept so old entries still typecheck.
  | "BECAME_MEMBER"
  | "RETURNED";

export type ContactMethod = "CALL" | "SMS" | "WHATSAPP" | "VISIT" | "OTHER";

export type ContactOutcome = "REACHED" | "NO_ANSWER" | "VOICEMAIL" | "WRONG_NUMBER" | "SCHEDULED_VISIT";

export type AbsenteeRiskCategory = "NEVER_ATTENDED" | "CONSECUTIVE_ABSENCES" | "BELOW_50_PERCENT";

export type MemberStatus = "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "DECEASED" | "OPTED_OUT";

export interface MissedService {
  id: string;
  name: string;
  scheduledAt: string;
}

export interface AbsenteeDetail {
  category: AbsenteeRiskCategory | null;
  /** Which of the last 8 recorded services this person missed. */
  missedServices: MissedService[];
  /** Of the last `totalRecent` services, how many they attended. */
  attendedCount: number;
  totalRecent: number;
}

export interface PersonRef {
  id: string;
  name: string;
  photoUrl: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ContactLogEntry {
  id: string;
  by: PersonRef;
  at: string;
  method: ContactMethod;
  outcome: ContactOutcome;
  note: string;
}

/** Extra intake detail for the drawer's "Contact & Details" section. Shape differs
 * by source: a Visitor (FIRST_TIMER) records who invited them and how they heard
 * about the church; a Member (ABSENTEE) doesn't — those fields stay null for one
 * side or the other rather than being two separate types. */
export interface PersonDetail {
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  /** ABSENTEE only. */
  memberSince: string | null;
  /** FIRST_TIMER only. */
  invitedBy: string | null;
  /** FIRST_TIMER only. */
  howTheyHeard: string | null;
  /** FIRST_TIMER only. */
  occupation: string | null;
}

export interface FollowUpEntry {
  id: string;
  person: PersonRef;
  personDetail: PersonDetail | null;
  sourceType: FollowUpSourceType;
  unitId: string;
  unitName: string;
  addedBy: PersonRef;
  addedAt: string;
  assignee: PersonRef | null;
  stage: FollowUpStage;
  goalContacts: number;
  contactCount: number;
  lastContactAt: string | null;
  outcome: FollowUpOutcome | null;
  reviewNote: string | null;
  /** Only set for ABSENTEE entries (Member-backed) — null for FIRST_TIMER (Visitor-backed). */
  memberStatus: MemberStatus | null;
  logs: ContactLogEntry[];
  /** Only set when sourceType is ABSENTEE. */
  absenteeDetail: AbsenteeDetail | null;
  /** Computed server-side, per entry: does the viewer lead *this entry's* unit (or
   * ADMIN+)? Not a blanket "is this user a leader somewhere" flag — a lead of one
   * unit can see another unit's entries via the shared pool / review queue without
   * being able to manage them. */
  viewerCanApprove: boolean;
  /** Can the viewer log a contact / mark ready on this entry (assignee, or viewerCanApprove). */
  viewerCanWork: boolean;
}
