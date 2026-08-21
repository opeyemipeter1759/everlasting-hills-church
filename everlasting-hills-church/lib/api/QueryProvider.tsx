"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useEffect, useState } from "react";
import type { ApiError } from "./axios";
import { patchFrontendSession, SESSION_CLEARED_EVENT } from "@/lib/auth/frontend-session";
import type { MeResponse } from "@/lib/api";
import { setServiceWorkerUser } from "@/lib/pwa/service-worker";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // This cookie is only a display hint for header/sidebar UI. Middleware
        // ignores it for authorization and uses server-authenticated role data.
        queryCache: new QueryCache({
          onSuccess: (data, query) => {
            if (query.queryKey[0] === "auth" && query.queryKey[1] === "me") {
              const me = data as MeResponse;
              // Passing null is intentional: revoking the final role must also
              // remove an old role badge rather than leave a stale cookie.
              patchFrontendSession({ role: me.role });
              // Rehydrate the worker after every page/worker restart. Until
              // this trusted response arrives the worker does not cache member
              // API reads, so no authenticated response is stored as "anon".
              if (me.profileId) void setServiceWorkerUser(me.profileId);
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
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    const clearPrivateQueries = () => queryClient.clear();
    window.addEventListener(SESSION_CLEARED_EVENT, clearPrivateQueries);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, clearPrivateQueries);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
