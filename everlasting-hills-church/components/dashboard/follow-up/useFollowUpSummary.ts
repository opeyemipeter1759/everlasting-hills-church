"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTotalMembers } from "@/lib/api";
import { useFollowUpEntries } from "@/lib/api/follow-up-pipeline";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { ApiError } from "@/lib/api/axios";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface FollowUpSummary {
  /** Everyone on the church roll, including those who never signed in. */
  totalMembers: number;
  /** Assigned to whoever is looking — so this figure differs per person. */
  assignedToMe: number;
  integrated: number;
  optedOut: number;
  /** Contacted in the last 7 days, and that as a portion of everyone active. */
  reachedThisWeek: number;
  total: number;
  progress: number;
  toCall: number;
  updatedAt: number;
  isFetching: boolean;
  /** First load — the figures are not known yet, so show placeholders, not zeros. */
  isLoading: boolean;
  /** The viewer isn't on a follow-up team — show the header without figures. */
  denied: boolean;
  refresh: () => void;
}

/**
 * The figures the Follow Up header states, worked out from the entries the
 * viewer can already see — one query, so the header costs nothing extra.
 */
export function useFollowUpSummary(): FollowUpSummary {
  const queryClient = useQueryClient();
  const { data: entries = [], isFetching, isLoading: entriesLoading, dataUpdatedAt, error } = useFollowUpEntries({});
  const { data: members, isLoading: membersLoading } = useTotalMembers();
  // Integrated, opted out and your own caseload are counted over the Master
  // List itself, so the cards say what the table says.
  const { data: counts, isLoading: countsLoading, isFetching: countsFetching } = useFollowUpCounts();

  return useMemo(() => {
    const active = entries.filter((e) => e.memberStatus !== "OPTED_OUT");
    const since = Date.now() - WEEK_MS;
    const reachedThisWeek = active.filter(
      (e) => e.lastContactAt && new Date(e.lastContactAt).getTime() >= since,
    ).length;

    return {
      totalMembers: members?.total ?? 0,
      assignedToMe: counts?.assignedToMe ?? 0,
      integrated: counts?.byStatus.INTEGRATED ?? 0,
      optedOut: counts?.byStatus.OPTED_OUT ?? 0,
      reachedThisWeek,
      total: active.length,
      progress: active.length === 0 ? 0 : Math.round((reachedThisWeek / active.length) * 100),
      toCall: active.filter((e) => e.dueStatus === "DUE" || e.dueStatus === "OVERDUE").length,
      updatedAt: dataUpdatedAt,
      isFetching: isFetching || countsFetching,
      isLoading: entriesLoading || membersLoading || countsLoading,
      denied: (error as ApiError | null)?.status === 403,
      refresh: () => queryClient.invalidateQueries({ queryKey: ["follow-up"] }),
    };
  }, [
    entries,
    members,
    counts,
    isFetching,
    countsFetching,
    entriesLoading,
    membersLoading,
    countsLoading,
    dataUpdatedAt,
    error,
    queryClient,
  ]);
}
