"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** Where a first-timer stands: from their stage and visits, or as the team set it by hand. */
export type PipelineStatus = "FIRST_TIMER" | "SECOND_TIMER" | "THIRD_TIMER" | "FOURTH_TIMER" | "AWAY" | "INTEGRATED" | "REMOTE" | "OPTED_OUT";

export const PIPELINE_STATUSES: PipelineStatus[] = ["FIRST_TIMER", "SECOND_TIMER", "THIRD_TIMER", "FOURTH_TIMER", "AWAY", "INTEGRATED", "REMOTE", "OPTED_OUT"];

/** What the board may set by hand; Integrated and Opted out keep their own flows. */
/** REMOTE (EHC Remote Church) is only for an integrated member, set by the Integration Team. */
export type OverrideStatus = "FIRST_TIMER" | "SECOND_TIMER" | "THIRD_TIMER" | "FOURTH_TIMER" | "AWAY" | "REMOTE";

export interface PipelineRow {
  visitorId: string;
  memberId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  photoKey: string | null;
  /** Signed, short-lived photo URL when the list asked for photos. */
  photoUrl?: string | null;
  /** "YYYY-MM-DD", church-local. */
  firstVisitDate: string;
  submittedAt: string;
  visits: number;
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
  /** Set by hand, winning over their visits; null while they follow their visits. */
  statusOverride?: OverrideStatus | null;
}

export type StatusCounts = Record<PipelineStatus, number>;

export interface PipelinePage {
  rows: PipelineRow[];
  total: number;
  counts: StatusCounts & { all: number };
}

export interface PipelineQuery {
  status?: PipelineStatus | "";
  stage?: string;
  assigneeId?: string;
  unitId?: string;
  student?: boolean;
  year?: number;
  month?: number;
  search?: string;
  notContacted?: boolean;
  /** Only integrated members, including any the Integration Team has since marked Away. */
  integrated?: boolean;
  absentFrom?: string;
  /** A service id: only people with an account who were checked in at it. */
  presentAt?: string;
  possibleReturn?: boolean;
  sort?: "newest" | "oldest" | "name";
  take?: number;
  skip?: number;
}

export interface MonthSummary {
  /** "YYYY-MM-01" */
  month: string;
  total: number;
  counts: StatusCounts;
  due48: number;
  reached48: number;
  tracked: boolean;
}

export interface YearSummary {
  year: number;
  months: MonthSummary[];
  total: MonthSummary;
  firstYear: number;
}

/** Drops empty values so the query string, and the cache key, only carry real filters. */
export function pipelineParams(q: PipelineQuery): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === "" || value === false) continue;
    out[key] = String(value);
  }
  return out;
}

/** People and the counts beside them, under the same filters: the one list every follow-up page reads. */
export function usePipeline(q: PipelineQuery, enabled = true) {
  const params = pipelineParams(q);
  return useQuery({
    queryKey: ["follow-up", "pipeline", params],
    queryFn: () => api.get<PipelinePage>("/follow-up/pipeline", params),
    enabled: enabled && typeof window !== "undefined",
  });
}

export function usePipelineYear(year: number) {
  return useQuery({
    queryKey: ["follow-up", "overview", year],
    queryFn: () => api.get<YearSummary>(`/follow-up/overview/${year}`),
    enabled: typeof window !== "undefined",
  });
}
