"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * Reading plan client.
 *
 * The split between cached and private that the API enforces is mirrored here
 * in the query keys and stale times. Plans and scripture are immutable, so they
 * are cached hard. A member's own progress is refetched, never shared.
 */

export type ReadingTrack = "NEW_BELIEVER" | "GROWING" | "MATURE";

export interface ReadingPlanSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  track: ReadingTrack;
  durationDays: number;
  avgMinutesPerDay: number | null;
  coverImageUrl: string | null;
  version: number;
}

export interface DayPortion {
  sequence: number;
  label: string | null;
  startVerseId: number;
  endVerseId: number;
  isOptional: boolean;
}

export interface PlanDay {
  dayIndex: number;
  title: string | null;
  referenceLabel: string;
  reflectionPrompt: string | null;
  estimatedMinutes: number;
  Portions: DayPortion[];
}

export interface TodayReading {
  subscriptionId: string;
  plan: { id: string; slug: string; title: string; durationDays: number };
  translation: { id: number; code: string; name: string };
  timezone: string;
  currentDayIndex: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  lastReadOn: string | null;
  reminderHour: number | null;
  /** Drift for encouragement. Never rendered as days behind. */
  paceDelta: number;
  completedToday: boolean;
  day: PlanDay | null;
}

export interface Passage {
  translation: { code: string; name: string };
  reference: string;
  startVerseId: number;
  endVerseId: number;
  verses: { verseId: number; book: string; chapter: number; verse: number; text: string }[];
}

const ME_KEY = ["reading-plan", "me"] as const;

/** Today's reading. Null is a normal answer: the member has not chosen a plan. */
export function useTodayReading() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<TodayReading | null>("/me/reading-plan"),
  });
}

export function useReadingPlans(track?: ReadingTrack) {
  return useQuery({
    queryKey: ["reading-plan", "catalogue", track ?? "all"],
    queryFn: () =>
      api.get<ReadingPlanSummary[]>(`/reading-plans${track ? `?track=${track}` : ""}`),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Scripture for one portion.
 *
 * An hour of staleness is conservative for text that has not changed in
 * centuries; the server allows a year. Keeping it in the client cache means
 * paging back through a passage costs nothing.
 */
export function usePassage(startVerseId?: number, endVerseId?: number, translation?: string) {
  return useQuery({
    queryKey: ["bible", "passage", translation ?? "default", startVerseId, endVerseId],
    queryFn: () =>
      api.get<Passage>(
        `/bible/passage?start=${startVerseId}&end=${endVerseId}${
          translation ? `&translation=${translation}` : ""
        }`,
      ),
    enabled: Boolean(startVerseId && endVerseId),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSubscribeToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string; translationCode?: string; timezone?: string }) =>
      api.post<{ id: string }>("/me/reading-plan/subscriptions", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

/**
 * Marks a day read.
 *
 * Addressed by day index rather than "next", which is what makes a retry or a
 * double tap harmless: the server answers the same state either way.
 */
export function useCompleteDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, dayIndex }: { subscriptionId: string; dayIndex: number }) =>
      api.put<{ currentDayIndex: number; completedDays: number; currentStreak: number }>(
        `/me/reading-plan/subscriptions/${subscriptionId}/days/${dayIndex}/complete`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

export function useUncompleteDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, dayIndex }: { subscriptionId: string; dayIndex: number }) =>
      api.delete<{ currentDayIndex: number; completedDays: number }>(
        `/me/reading-plan/subscriptions/${subscriptionId}/days/${dayIndex}/complete`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}
