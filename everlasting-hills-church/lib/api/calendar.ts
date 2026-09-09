"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export type CalendarEventStatus = "DRAFT" | "PUBLISHED";

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  /** ISO 8601 */
  startAt: string;
  /** ISO 8601, or null for an event with no end time. */
  endAt: string | null;
  status: CalendarEventStatus;
  featured: boolean;
  venueName: string | null;
}

export interface CalendarSummary {
  upcoming: CalendarEvent[];
  counts: { thisWeek: number; thisMonth: number; drafts: number };
}

/** Mirrors `MemberCalendarItem` in ehc-backend/src/calendar/services/calendar-feed.service.ts. */
export interface MemberCalendarItem {
  id: string;
  kind: "service" | "event";
  title: string;
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
  location: string | null;
  cancelled: boolean;
  servingRoles: string[] | null;
  slug: string | null;
}

const KEY = ["calendar"] as const;

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Events overlapping [from, to]. Both bounds are ISO strings and form part of the
 * query key, so paging to another month refetches rather than serving the old window.
 */
export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: [...KEY, "range", from, to],
    queryFn: () => api.get<CalendarEvent[]>(`/events/admin/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  });
}

/** Next published events + week/month/draft counts, for the superadmin home card. */
export function useCalendarSummary() {
  return useQuery({
    queryKey: [...KEY, "summary"],
    queryFn: () => api.get<CalendarSummary>("/events/admin/calendar/summary"),
  });
}

/** The signed-in member's own upcoming services and events. Any signed-in member. */
export function useMyUpcomingCalendar() {
  return useQuery({
    queryKey: [...KEY, "me", "upcoming"],
    queryFn: () => api.get<MemberCalendarItem[]>("/calendar/me/upcoming"),
    // Keeps the page current on its own (new services/events, cancellations)
    // without the member needing to remember to hit refresh.
    refetchInterval: 5 * 60 * 1000,
  });
}
