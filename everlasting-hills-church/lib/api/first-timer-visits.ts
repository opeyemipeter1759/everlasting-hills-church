"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { OverrideStatus, PipelineRow } from "@/lib/api/pipeline";
import { useRefreshFollowUp } from "@/lib/api/first-timer-profile";

/** How a visit was recorded. Dates from check-ins have no row and so no source. */
export type VisitSource = "FORM" | "CAME_AGAIN" | "RETURN_FORM" | "BACKFILL" | "BACKFILL_STATUS";

export interface FirstTimerVisits {
  firstVisitDate: string;
  visitDates: string[];
  recorded: { date: string; source: VisitSource }[];
  /** The church-local day of the latest service held: what Came again defaults to. */
  latestServiceDate: string;
}

export interface PossibleReturnMatch {
  pending: boolean;
  visitor: { id: string; firstName: string; lastName: string; firstVisitDate: string } | null;
  member: { id: string; firstName: string; lastName: string } | null;
}

const base = (visitorId: string) => `/follow-up/first-timers/${visitorId}`;

export function useFirstTimerVisits(visitorId: string, enabled = true) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId, "visits"],
    queryFn: () => api.get<FirstTimerVisits>(`${base(visitorId)}/visits`),
    enabled: enabled && typeof window !== "undefined",
  });
}

/** "Came again". Every list and count refreshes, since the person's status may change. */
export function useCameAgain(visitorId: string) {
  const refresh = useRefreshFollowUp();
  return useMutation({
    mutationFn: (date?: string) => api.post<{ added: boolean; date: string; person: PipelineRow }>(`${base(visitorId)}/visits`, date ? { date } : {}),
    onSuccess: () => refresh(),
  });
}

/** Set their status by hand (it wins over their visits), or null to follow their visits again. */
export function useSetFirstTimerStatus(visitorId: string) {
  const refresh = useRefreshFollowUp();
  return useMutation({
    mutationFn: (status: OverrideStatus | null) => api.patch<PipelineRow>(`${base(visitorId)}/status`, { status }),
    onSuccess: () => refresh(),
  });
}

export function useUndoVisit(visitorId: string) {
  const refresh = useRefreshFollowUp();
  return useMutation({
    mutationFn: (date: string) => api.delete<PipelineRow>(`${base(visitorId)}/visits/${date}`),
    onSuccess: () => refresh(),
  });
}

export function useCorrectFirstVisit(visitorId: string) {
  const refresh = useRefreshFollowUp();
  return useMutation({
    mutationFn: (date: string) => api.patch<PipelineRow>(`${base(visitorId)}/first-visit`, { date }),
    onSuccess: () => refresh(),
  });
}

export function usePossibleReturn(visitorId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["follow-up", "first-timer", visitorId, "possible-return"],
    queryFn: () => api.get<PossibleReturnMatch>(`${base(visitorId)}/possible-return`),
    enabled: enabled && typeof window !== "undefined",
  });
}

/** "Same person" (confirm) or "Different person" (dismiss). Records are never merged. */
export function useResolvePossibleReturn(visitorId: string) {
  const refresh = useRefreshFollowUp();
  return useMutation({
    mutationFn: (decision: "confirm" | "dismiss") =>
      api.post<{ originalVisitorId?: string | null; memberId?: string | null; date?: string; resolved?: boolean }>(`${base(visitorId)}/possible-return/${decision}`),
    // Not awaited: after Same person this profile is archived, and the page moves on to the original straight away.
    onSuccess: () => {
      void refresh();
    },
  });
}

export interface MonthBreakdowns {
  heardFrom: { label: string; n: number }[];
  assignees: { id: string | null; name: string | null; n: number }[];
}

/** How one month's first-timers heard about the church, and who has them. */
export function useMonthBreakdowns(year: number, month: number) {
  return useQuery({
    queryKey: ["follow-up", "overview", year, month, "breakdowns"],
    queryFn: () => api.get<MonthBreakdowns>(`/follow-up/overview/${year}/${month}/breakdowns`),
    enabled: typeof window !== "undefined",
  });
}
