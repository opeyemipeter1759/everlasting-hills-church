"use client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import type { ApiError } from "./axios";
import { patchFrontendSession } from "@/lib/auth/frontend-session";
import type { MeResponse } from "@/lib/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Keeps the role hint cookie (read by middleware + the header's role badge)
        // in sync with the DB-computed role every time /auth/me resolves anywhere
        // in the app — otherwise a promotion/demotion made by an admin only shows
        // up for the affected user after their next login.
        queryCache: new QueryCache({
          onSuccess: (data, query) => {
            if (query.queryKey[0] === "auth" && query.queryKey[1] === "me") {
              const me = data as MeResponse;
              if (me.role) patchFrontendSession({ role: me.role });
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
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
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}