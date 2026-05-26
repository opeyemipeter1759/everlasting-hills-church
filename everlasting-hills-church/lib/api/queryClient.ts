// src/lib/api/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "./axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min — data considered fresh
      gcTime: 5 * 60 * 1000, // 5 min — cache garbage collection
      retry: (failureCount, error) => {
        const status = (error as ApiError)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});