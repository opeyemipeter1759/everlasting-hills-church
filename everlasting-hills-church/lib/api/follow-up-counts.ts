"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";

export interface FollowUpCounts {
  total: number;
  byStatus: Record<MasterListStatus, number>;
  assignedToMe: number;
  /** The Integration Team's own caseload for whoever is asking. */
  integrationAssignedToMe: number;
  unassigned: number;
  /** First timers on record — the same total the admin First Timers page shows. */
  visitors: number;
  /** The Follow Up board's own list: everyone not yet integrated or opted out. */
  followUp: {
    /** Came to the church's notice in the last seven days. */
    newThisWeek: number;
    /** Nobody on Follow Up is carrying them yet. */
    unassigned: number;
    /** Nothing logged on their thread in the last seven days. */
    quiet: number;
  };
}

/** How often the figures catch up with what the team has been doing. */
const REFRESH_MS = 60_000;

/**
 * The figures above the Master List, counted by the API over the very same
 * people the table lists — so a card can never disagree with the rows under
 * it. They re-count on their own each minute, and immediately after anyone
 * changes a status, because every follow-up mutation clears this key.
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
