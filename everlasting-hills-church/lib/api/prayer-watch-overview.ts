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
