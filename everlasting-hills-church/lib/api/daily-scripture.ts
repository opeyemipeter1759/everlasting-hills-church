"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface DailyScripture {
  date: string;
  timezone: string;
  reference: string;
  text: string;
  translationCode: string;
  translationName: string;
}

/**
 * Today's scripture, in the version the member chose. Without a choice the
 * church's default version is used.
 */
export function useDailyScripture(translation?: string) {
  return useQuery({
    queryKey: ["bible", "today", translation ?? "default"],
    queryFn: () =>
      api.get<DailyScripture>(
        translation ? "/bible/today?translation=" + encodeURIComponent(translation) : "/bible/today",
      ),
    // Switching version keeps the current verse on screen until the new one arrives.
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
