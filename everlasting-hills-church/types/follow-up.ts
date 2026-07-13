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

export type FollowUpOutcome = "BECAME_MEMBER" | "RETURNED" | "NOT_INTERESTED" | "UNREACHABLE";

export type ContactMethod = "CALL" | "SMS" | "WHATSAPP" | "VISIT" | "OTHER";

export type ContactOutcome = "REACHED" | "NO_ANSWER" | "VOICEMAIL" | "WRONG_NUMBER" | "SCHEDULED_VISIT";

export type AbsenteeRiskCategory = "NEVER_ATTENDED" | "CONSECUTIVE_ABSENCES" | "BELOW_50_PERCENT";

export interface MissedService {
  id: string;
  name: string;
  scheduledAt: string;
}

export interface AbsenteeDetail {
  category: AbsenteeRiskCategory | null;
  /** Which of the last 8 recorded services this person missed. */
  missedServices: MissedService[];
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

export interface FollowUpEntry {
  id: string;
  person: PersonRef;
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
