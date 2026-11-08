"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface WatchReport {
  /** The evening the night began, "YYYY-MM-DD". */
  night: string;
  startTime: string;
  endTime: string;
  minutes: number;
  peoplePresent: number;
  handedOver: boolean;
  handedOverTo: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface LedWatch {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  /** Where this watch falls in the night, from 0; picks its sky colour. */
  position: number;
  /** The watch that takes over, or null when this one closes the night. */
  next: { label: string; leaderName: string | null } | null;
  /** The last seven watch nights this watch has begun on, newest first. */
  nights: { night: string; report: WatchReport | null }[];
}

export interface WatchReportInput {
  slotId: string;
  nightDate: string;
  startTime: string;
  endTime: string;
  peoplePresent: number;
  handedOver: boolean;
  handedOverTo?: string;
  notes?: string;
}

/** The watches this member leads, with the last week of reports. Empty for anyone who doesn't lead one. */
export function useMyWatchReports() {
  return useQuery({
    queryKey: ["prayer-watch", "reports", "mine"],
    queryFn: () => api.get<{ slots: LedWatch[] }>("/prayer-watch/reports/mine"),
  });
}

/** Files or corrects one night's report; refreshes everything Prayer Watch, the admin overview included. */
export function useSubmitWatchReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WatchReportInput) => api.post<WatchReport>("/prayer-watch/reports", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prayer-watch"] }),
  });
}
