"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

/** Mirrors `GatheringView` in ehc-backend/src/gatherings/gatherings.service.ts. */
export interface Gathering {
  id: string;
  title: string;
  description: string | null;
  /** RFC 5545 RRULE, restricted server-side to FREQ=DAILY or FREQ=WEEKLY[;BYDAY=…]. */
  recurrenceRule: string;
  /** Anchor date, YYYY-MM-DD. */
  startDate: string;
  /** Local wall clock in `timezone`, HH:MM. */
  startTime: string;
  durationMinutes: number;
  timezone: string;
  joinUrl: string | null;
  isActive: boolean;
  /** ISO instant of the next occurrence, or null when none is scheduled. */
  nextOccurrenceAt: string | null;
  /** True when now falls inside an occurrence. */
  isLive: boolean;
  /** ISO instant the current occurrence ends, when live. */
  endsAt: string | null;
}

export interface GatheringInput {
  title: string;
  description?: string | null;
  recurrenceRule: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  joinUrl?: string | null;
  isActive?: boolean;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

const KEY = ["gatherings"] as const;

/**
 * How often the member-facing card re-asks the server.
 *
 * `isLive` and `nextOccurrenceAt` are computed server-side per request, so they
 * go stale in the client the moment they arrive. A minute is close enough that
 * a member never sits on a card saying "in 1 minute" long after the meeting
 * opened, and cheap enough to leave running on an idle dashboard tab.
 */
const LIVE_REFETCH_MS = 60_000;

/** Active gatherings with next-occurrence and live state. Any signed-in member. */
export function useGatherings() {
  return useQuery({
    queryKey: [...KEY, "active"],
    queryFn: () => api.get<Gathering[]>("/gatherings"),
    refetchInterval: LIVE_REFETCH_MS,
    // A tab left open overnight should show the morning meeting, not last night's.
    refetchOnWindowFocus: true,
  });
}

/** Everything including inactive. ADMIN+. */
export function useAllGatherings() {
  return useQuery({
    queryKey: [...KEY, "all"],
    queryFn: () => api.get<Gathering[]>("/gatherings/manage"),
  });
}

export function useCreateGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GatheringInput) => api.post<Gathering>("/gatherings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<GatheringInput> & { id: string }) =>
      api.patch<Gathering>(`/gatherings/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/gatherings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
