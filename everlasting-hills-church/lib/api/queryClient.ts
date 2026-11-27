// src/lib/api/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { LIVE_REFRESH_MS } from "./live-refresh";
import type { ApiError } from "./axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 1000, // 15 s: re-read on focus after this
      gcTime: 5 * 60 * 1000, // 5 min — cache garbage collection
      retry: (failureCount, error) => {
        const status = (error as ApiError)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      // Re-read every 30 s while visible, and on focus or reconnect (see QueryProvider).
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: LIVE_REFRESH_MS,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: false,
    },
  },
});