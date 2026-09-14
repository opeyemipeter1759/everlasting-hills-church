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

export function useDailyScripture() {
  return useQuery({
    queryKey: ["bible", "today"],
    queryFn: () => api.get<DailyScripture>("/bible/today"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
