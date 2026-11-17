"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { ApiError } from "@/lib/api/axios";

export interface FollowUpSummary {
  /** Everyone in the pipeline: the Master list's All. */
  total: number;
  /** First timers on record, with an account or not: the admin First Timers page's total too. */
  visitors: number;
  /** First, second and third timers: the people still being followed up. */
  followingUp: number;
  firstTimers: number;
  secondTimers: number;
  thirdTimers: number;
  /**
   * Of those still being followed up: new in the last seven days, with nobody
   * assigned, and with nothing logged in the last seven days. Null until the API sends them.
   */
  thisWeek: { newThisWeek: number; unassigned: number; quiet: number } | null;
  /** Assigned to whoever is looking, so this figure differs per person. */
  assignedToMe: number;
  integrated: number;
  optedOut: number;
  updatedAt: number;
  isFetching: boolean;
  /** First load: the figures are not known yet, so show placeholders, not zeros. */
  isLoading: boolean;
  /** The viewer isn't on a follow-up team: show the header without figures. */
  denied: boolean;
  refresh: () => void;
}

/**
 * The figures the Follow Up header states. Every one is counted by the API
 * from the first-timer pipeline, so the summary, the cards and the tab badges
 * always say what the lists say. Nothing is added up here.
 */
export function useFollowUpSummary(): FollowUpSummary {
  const queryClient = useQueryClient();
  const { data: counts, isLoading, isFetching, dataUpdatedAt, error } = useFollowUpCounts();

  return useMemo(() => {
    const by = counts?.byStatus;
    const followUp = counts?.followUp;
    return {
      total: counts?.total ?? 0,
      visitors: counts?.visitors ?? 0,
      followingUp: counts?.followingUp ?? 0,
      firstTimers: by?.FIRST_TIMER ?? 0,
      secondTimers: by?.SECOND_TIMER ?? 0,
      thirdTimers: by?.THIRD_TIMER ?? 0,
      thisWeek: followUp ? { newThisWeek: followUp.newThisWeek, unassigned: followUp.unassigned, quiet: followUp.quiet } : null,
      assignedToMe: counts?.assignedToMe ?? 0,
      integrated: by?.INTEGRATED ?? 0,
      optedOut: by?.OPTED_OUT ?? 0,
      updatedAt: dataUpdatedAt,
      isFetching,
      isLoading,
      denied: (error as ApiError | null)?.status === 403,
      refresh: () => queryClient.invalidateQueries({ queryKey: ["follow-up"] }),
    };
  }, [counts, isFetching, isLoading, dataUpdatedAt, error, queryClient]);
}
