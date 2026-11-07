"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface OverviewSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  confirmed: number;
  workers: number;
  pending: number;
  leaderName: string | null;
  leaderTermEndsAt: string | null;
  whatsappLinkSet: boolean;
}

/** "not-yet": the watch hasn't ended, or ended within the hour. */
export type WatchNightStatus = "reported" | "missing" | "not-yet";

export interface ChainWatch {
  slotId: string;
  status: WatchNightStatus;
  minutes: number;
  people: number;
  handedOver: boolean;
  handedOverTo: string | null;
  notes: string | null;
}

/** Watch leaders' nightly reports. Nights before the first report ever filed are untracked. */
export interface ReportsSummary {
  fullNightMinutes: number;
  trackingSince: string | null;
  thisWeekMinutes: number;
  lastWeekMinutes: number;
  reportsIn: number;
  reportsDue: number;
  handoversMade: number;
  averagePeople: number | null;
  /** Four weeks of watch nights, oldest first. */
  daily: { night: string; tracked: boolean; minutes: number; people: number; reported: number; missing: number }[];
  /** The last week of tracked nights, newest first, one entry per watch in order. */
  chain: { night: string; watches: ChainWatch[] }[];
}

export interface PrayerWatchOverviewData {
  generatedAt: string;
  watchTitle: string;
  telegramLinkSet: boolean;
  totals: {
    confirmed: number;
    workers: number;
    pending: number;
    declined: number;
    removed: number;
    familyChangesPending: number;
    reflections30d: number;
    reflectionsTotal: number;
  };
  oldestPendingAt: string | null;
  medianWaitHours: number | null;
  slots: OverviewSlot[];
  weekly: { weekStart: string; joined: number }[];
  reports: ReportsSummary | null;
  latestReflection: { excerpt: string; firstName: string; watchLabel: string; createdAt: string } | null;
}

/** The admin overview. Shares the Prayer Watch cache prefix, so approving or moving someone refreshes it. */
export function usePrayerWatchOverview() {
  return useQuery({
    queryKey: ["prayer-watch", "admin", "overview"],
    queryFn: () => api.get<PrayerWatchOverviewData | null>("/prayer-watch/admin/overview"),
    refetchInterval: 60_000,
  });
}
