"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PipelineStatus } from "@/lib/api/pipeline";

export interface FollowUpCounts {
  /** Everyone in the first-timer pipeline: the sum of byStatus. */
  total: number;
  byStatus: Record<PipelineStatus, number>;
  /** First, second and third timers: the people still being followed up. */
  followingUp: number;
  /** Assigned to whoever is asking, whatever their status: the Assigned to me tab's total. */
  assignedToMe: number;
  /** Still being followed up, with nobody assigned. */
  unassigned: number;
  /** First timers on record: the same total the admin First Timers page shows. */
  visitors: number;
  /** The summary at the top of the Follow Up page. */
  followUp: {
    /** First visit in the last seven days. */
    newThisWeek: number;
    /** Still being followed up, with nobody assigned. */
    unassigned: number;
    /** Still being followed up, with nothing logged in the last seven days. */
    quiet: number;
  };
}

/** How often the figures catch up with what the team has been doing. */
const REFRESH_MS = 60_000;

/**
 * The figures on the Follow Up page, read by the API from the first-timer
 * pipeline under the same filter each list uses, so a card or a badge can
 * never disagree with the rows it opens. They re-count on their own each
 * minute, and straight after any follow-up change, which clears this key.
 */
export function useFollowUpCounts() {
  return useQuery({
    queryKey: ["follow-up", "counts"],
    queryFn: () => api.get<FollowUpCounts>("/follow-up/counts"),
    enabled: typeof window !== "undefined",
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}
