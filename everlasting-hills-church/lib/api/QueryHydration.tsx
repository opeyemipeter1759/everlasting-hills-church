"use client";

import { useMemo, type ReactNode } from "react";
import { dehydrate, HydrationBoundary, QueryClient, type DehydratedState } from "@tanstack/react-query";

/** One query's data, under the exact key its hook reads. */
export type SeedEntry = { key: readonly unknown[]; value: unknown };

/** The entries as a React Query cache snapshot. Callers decide which entries to include. */
export function dehydrateEntries(entries: SeedEntry[]): DehydratedState {
  const client = new QueryClient();
  for (const { key, value } of entries) client.setQueryData(key, value);
  return dehydrate(client);
}

/**
 * Hands data a page loaded on the server (in one request) to the hooks its
 * components already use, so none of them fetch when the page first opens.
 * Later refreshes still go through each hook's own endpoint.
 */
export function QueryHydration({ entries, children }: { entries: SeedEntry[]; children: ReactNode }) {
  const state = useMemo(() => dehydrateEntries(entries), [entries]);
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
