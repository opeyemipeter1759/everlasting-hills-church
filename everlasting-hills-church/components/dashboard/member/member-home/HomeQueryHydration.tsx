"use client";

import { useMemo, type ReactNode } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import type { MemberHomeData } from "@/app/dashboard/(dashboard)/_loaders/member-home/types";
import { dehydrateHome } from "./home-queries";

/** Puts the /member-home answer into the cards' queries before they render. */
export function HomeQueryHydration({ data, children }: { data: MemberHomeData | null; children: ReactNode }) {
  const state = useMemo(() => (data ? dehydrateHome(data) : undefined), [data]);
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
