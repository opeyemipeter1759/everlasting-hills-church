/**
 * Where a first-timer stands, worked out from their stage and their visits and
 * never stored. First match wins: opted out, integrated, then 3+, 2 or 1 visits.
 */
export type PipelineStatus = 'FIRST_TIMER' | 'SECOND_TIMER' | 'THIRD_TIMER' | 'INTEGRATED' | 'OPTED_OUT';

export const PIPELINE_STATUSES: PipelineStatus[] = ['FIRST_TIMER', 'SECOND_TIMER', 'THIRD_TIMER', 'INTEGRATED', 'OPTED_OUT'];

export interface PipelineFilters {
  status?: PipelineStatus;
  /** A FollowUpStage value. */
  stage?: string;
  /** A member id, or "none" for nobody assigned. */
  assigneeId?: string;
  /** The unit the assignment sits under. */
  unitId?: string;
  student?: boolean;
  /** Bucket on the church-local first visit date. */
  year?: number;
  /** 1 to 12; only with year. */
  month?: number;
  /** Name or phone. */
  search?: string;
  /** Only people nobody has contacted yet. */
  notContacted?: boolean;
  /** A service id: only people with an account who missed that service. */
  absentFromServiceId?: string;
  /** Only forms flagged as a possible return visit, not yet resolved. */
  possibleReturn?: boolean;
  /** Only these people (visitor ids), e.g. a unit lead's approval queue. */
  visitorIds?: string[];
  take?: number;
  skip?: number;
  /** newest (first visit, newest first, the default), oldest, or name. */
  sort?: 'newest' | 'oldest' | 'name';
}

export interface PipelineRow {
  visitorId: string;
  /** Their member id once an account was made from the form. */
  memberId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  photoKey: string | null;
  /** "YYYY-MM-DD", church-local. */
  firstVisitDate: string;
  submittedAt: string;
  visits: number;
  /** Every visit date, "YYYY-MM-DD", oldest first. */
  visitDates: string[];
  status: PipelineStatus;
  entryId: string | null;
  stage: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  unitId: string | null;
  unitName: string | null;
  assignedAt: string | null;
  firstContactedAt: string | null;
  heardFrom: string | null;
  invitedBy: string | null;
  heardFromOther: string | null;
  isStudent: boolean | null;
  possibleReturn: boolean;
}

export type StatusCounts = Record<PipelineStatus, number>;

export interface PipelinePage {
  rows: PipelineRow[];
  /** Everyone matching the filters, status included: what the list is showing. */
  total: number;
  /** Everyone matching the filters except status, broken down by status. */
  counts: StatusCounts & { all: number };
}

export interface MonthSummary {
  /** "YYYY-MM-01" */
  month: string;
  total: number;
  counts: StatusCounts;
  /** People whose 48-hour window has closed. */
  due48: number;
  /** Of those, how many were contacted inside it. */
  reached48: number;
  /** False for months before first contacts were logged at all. */
  tracked: boolean;
}

export interface YearSummary {
  year: number;
  months: MonthSummary[];
  total: MonthSummary;
  /** The earliest year anyone first visited, for the year picker. */
  firstYear: number;
}
