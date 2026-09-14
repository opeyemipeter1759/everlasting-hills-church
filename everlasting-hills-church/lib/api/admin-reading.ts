"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * READING      read at least once in the last seven days
 * QUIET        has a plan in progress or paused, but no reading this week
 * FINISHED     every plan they started is complete
 * NOT_STARTED  has never started a plan
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
}

/** How every active member is reading. Pastors and admins only; read-only. */
export function useReadingMonitor() {
  return useQuery({
    queryKey: ["reading-monitor"],
    queryFn: () => api.get<ReadingMonitorData>("/reading-monitor"),
  });
}
