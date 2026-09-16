"use client";

import { useQuery } from "@tanstack/react-query";
import { userMessageForError } from "@/lib/api/user-message";

export interface DailyScripture {
  date: string;
  timezone: string;
  reference: string;
  text: string;
  translationCode: string;
  translationName: string;
}

export interface ScriptureVersion {
  code: string;
  name: string;
  isDefault: boolean;
}

/**
 * Scripture comes from the website's own /api/scripture routes rather than the
 * API proxy. They ask the API and fall back to a bundled copy, so visitors and
 * members still get the verse when the API is unavailable.
 */
async function getScripture<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (error) {
    throw { message: userMessageForError(error) };
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw {
      status: response.status,
      message: userMessageForError({ status: response.status, message: body?.error?.message }),
    };
  }
  return (await response.json()) as T;
}

/**
 * Today's public scripture, in the version the reader chose. Without a choice
 * the church's default version is used.
 */
export function useDailyScripture(translation?: string) {
  return useQuery({
    queryKey: ["bible", "today", translation ?? "default"],
    queryFn: () =>
      getScripture<DailyScripture>(
        translation ? `/api/scripture/today?translation=${encodeURIComponent(translation)}` : "/api/scripture/today",
      ),
    // Switching version keeps the current verse on screen until the new one arrives.
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Bible versions the daily scripture is available in. */
export function useScriptureVersions() {
  return useQuery({
    queryKey: ["bible", "scripture-versions"],
    queryFn: () => getScripture<ScriptureVersion[]>("/api/scripture/translations"),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
