"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * The sermon digest: the API watches the church YouTube channel, finds the
 * sermon in each new service and has Gemini summarise it and pick a Word of
 * the Day. The website reads it through its own /api/latest-summary and
 * /api/word-of-the-day routes; the Gemini and YouTube keys stay on the API.
 */

export interface WordOfTheDay {
  word: string;
  meaning: string;
  verse: { reference: string; text: string };
  reflection: string;
  preacherQuote: string;
  /** First-person lines to say out loud, drawn from the sermon. */
  confession: string[];
}

interface Ready {
  ready: true;
  videoId: string;
  sermonTitle: string;
  preacher: string;
  serviceDay: "SUNDAY" | "WEDNESDAY" | "OTHER";
  serviceDate: string;
  /** Opens the YouTube video where the sermon starts. */
  watchUrl: string;
}

export type LatestSummary =
  | (Ready & {
      videoTitle: string;
      bibleReferences: string[];
      summary: string;
      keyPoints: string[];
      wordOfTheDay: WordOfTheDay;
      sermonStartSeconds: number;
      sermonEndSeconds: number;
      generatedAt: string;
    })
  | { ready: false };

export type WordOfTheDayResponse = (Ready & WordOfTheDay) | { ready: false };
export type ReadyWordOfTheDay = Ready & WordOfTheDay;

/**
 * The Word of the Day once one exists, else null. An explicit guard, because
 * TypeScript doesn't narrow `data?.ready ? data : null` through React Query's
 * result type on its own.
 */
export function readyWordOfTheDay(response: WordOfTheDayResponse | undefined): ReadyWordOfTheDay | null {
  return response !== undefined && response.ready === true ? (response as ReadyWordOfTheDay) : null;
}

async function getDigest<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return (await response.json()) as T;
}

// Short, so a page left open across Lagos midnight shows the new day's
// confession within a minute of coming back to it.
const QUERY = { staleTime: 60_000, refetchOnWindowFocus: true, retry: 1 } as const;

export function useLatestSummary() {
  return useQuery({ queryKey: ["sermon-digest", "latest"], queryFn: () => getDigest<LatestSummary>("/api/latest-summary"), ...QUERY });
}

export function useWordOfTheDay() {
  return useQuery({ queryKey: ["sermon-digest", "word"], queryFn: () => getDigest<WordOfTheDayResponse>("/api/word-of-the-day"), ...QUERY });
}

/** "Sunday service · 20 Sep" */
export function serviceLabel(day: Ready["serviceDay"], iso: string): string {
  const name = day === "SUNDAY" ? "Sunday service" : day === "WEDNESDAY" ? "Wednesday service" : "Service";
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }).format(new Date(iso));
  return `${name} · ${date}`;
}
