"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GoogleCalendarStatus {
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
}

/** Mirrors `PersonalCalendarEvent` in ehc-backend/src/calendar/services/google-calendar-events.service.ts. */
export interface PersonalCalendarEvent {
  id: string;
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string | null;
}

const KEY = ["google-calendar"] as const;

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Whether the signed-in member has connected their personal Google Calendar. */
export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: [...KEY, "status"],
    queryFn: () => api.get<GoogleCalendarStatus>("/calendar/google/status"),
    retry: false,
  });
}

/** Fetches the Google consent URL — the caller navigates the browser there. */
export function useConnectGoogleCalendar() {
  return useMutation({
    mutationFn: () => api.get<{ url: string }>("/calendar/google/connect"),
  });
}

export function useDisconnectGoogleCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ disconnected: boolean }>("/calendar/google/disconnect"),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Pushes church services/events/gatherings into the member's connected Google Calendar right now. */
export function useSyncGoogleCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ synced: number; removed: number }>("/calendar/google/sync"),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** The member's own upcoming events, read from their connected Google Calendar. */
export function useGoogleCalendarEvents(enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "events"],
    queryFn: () => api.get<PersonalCalendarEvent[]>("/calendar/google/events"),
    enabled,
    retry: false,
    // This hits Google's API live on every call, so the interval is longer
    // than the church-calendar side — frequent enough to feel current,
    // not so tight it burns quota for a view nobody's actively watching.
    refetchInterval: 5 * 60 * 1000,
  });
}
