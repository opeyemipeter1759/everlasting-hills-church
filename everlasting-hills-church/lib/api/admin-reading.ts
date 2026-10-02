"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * READING      read at least once in the last seven days
 * QUIET        has a plan in progress or paused, but no reading this week
 * FINISHED     every plan they started is complete
 * NOT_STARTED  has no plan right now: never started, or removed them all
 */
export type ReaderState = "READING" | "QUIET" | "FINISHED" | "NOT_STARTED";

export interface ReaderPlan {
  title: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  completedDays: number;
  durationDays: number;
}

export interface Reader {
  memberId: string;
  name: string;
  photoUrl: string | null;
  state: ReaderState;
  /** Member-local date of their latest reading, YYYY-MM-DD. */
  lastReadOn: string | null;
  readingsLast7: number;
  readingsLast30: number;
  currentStreak: number;
  plans: ReaderPlan[];
}

export interface ReadingMonitorData {
  /** The church's date (Lagos), which "last read" is measured from. */
  today: string;
  stats: {
    activeMembers: number;
    reading: number;
    quiet: number;
    finished: number;
    notStarted: number;
    readingsThisWeek: number;
    plansCompleted: number;
  };
  readers: Reader[];
  /**
   * What "Clear gone quiet" would remove: in-progress or paused plans of
   * members who have gone quiet, begun before this week. Optional because an
   * older cached response may not carry it.
   */
  clearable?: { plans: number; members: number };
}

/** How every active member is reading. Pastors and admins only; read-only. */
export function useReadingMonitor() {
  return useQuery({
    queryKey: ["reading-monitor"],
    queryFn: () => api.get<ReadingMonitorData>("/reading-monitor"),
  });
}

/**
 * Clears gone quiet in one step. The admin confirms the number of plans they
 * were shown; if the list has changed since, the server removes nothing.
 */
export function useClearGoneQuiet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expectedPlans: number) =>
      api.post<{ removedPlans: number; members: number }>("/reading-monitor/clear-gone-quiet", { expectedPlans }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-monitor"] }),
  });
}
