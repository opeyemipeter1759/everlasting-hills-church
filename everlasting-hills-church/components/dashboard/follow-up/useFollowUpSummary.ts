"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { ApiError } from "@/lib/api/axios";

export interface FollowUpSummary {
  /** First timers on record, with an account or not — the admin First Timers page's total too. */
  visitors: number;
  /** The Master list tab: everyone not yet integrated or opted out. */
  followingUp: number;
  firstTimers: number;
  secondTimers: number;
  thirdTimers: number;
  away: number;
  /**
   * Of the Master list: new in the last seven days, with nobody assigned, and
   * with nothing logged in the last seven days. Null until the API sends them.
   */
  thisWeek: { newThisWeek: number; unassigned: number; quiet: number } | null;
  /** Assigned to whoever is looking — so this figure differs per person. */
  assignedToMe: number;
  integrated: number;
  optedOut: number;
  updatedAt: number;
  isFetching: boolean;
  /** First load — the figures are not known yet, so show placeholders, not zeros. */
  isLoading: boolean;
  /** The viewer isn't on a follow-up team — show the header without figures. */
  denied: boolean;
  refresh: () => void;
}

/**
 * The figures the Follow Up header states. All of them are counted by the API
 * over the same roll the Master List reads, so the summary, the cards and the
 * tab badges always say what the table says.
 */
export function useFollowUpSummary(): FollowUpSummary {
  const queryClient = useQueryClient();
  const { data: counts, isLoading, isFetching, dataUpdatedAt, error } = useFollowUpCounts();

  return useMemo(() => {
    const by = counts?.byStatus;
    const followUp = counts?.followUp;
    return {
      visitors: counts?.visitors ?? 0,
      // The Master list holds everyone not yet integrated or opted out.
      followingUp: by ? by.FIRST_TIMER + by.SECOND_TIMER + by.THIRD_TIMER + by.AWAY : 0,
      firstTimers: by?.FIRST_TIMER ?? 0,
      secondTimers: by?.SECOND_TIMER ?? 0,
      thirdTimers: by?.THIRD_TIMER ?? 0,
      away: by?.AWAY ?? 0,
      thisWeek: followUp ? { newThisWeek: followUp.newThisWeek, unassigned: followUp.unassigned, quiet: followUp.quiet } : null,
      assignedToMe: counts?.assignedToMe ?? 0,
      integrated: counts?.byStatus.INTEGRATED ?? 0,
      optedOut: counts?.byStatus.OPTED_OUT ?? 0,
      updatedAt: dataUpdatedAt,
      isFetching,
      isLoading,
      denied: (error as ApiError | null)?.status === 403,
      refresh: () => queryClient.invalidateQueries({ queryKey: ["follow-up"] }),
    };
  }, [counts, isFetching, isLoading, dataUpdatedAt, error, queryClient]);
}
