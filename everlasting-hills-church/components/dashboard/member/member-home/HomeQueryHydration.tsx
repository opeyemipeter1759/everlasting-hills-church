"use client";

import { useMemo, type ReactNode } from "react";
import { QueryHydration } from "@/lib/api/QueryHydration";
import type { MemberHomeData } from "@/app/dashboard/(dashboard)/_loaders/member-home/types";
import { homeSeedEntries } from "./home-queries";

/** Puts the /member-home answer into the cards' queries before they render. */
export function HomeQueryHydration({ data, children }: { data: MemberHomeData | null; children: ReactNode }) {
  const entries = useMemo(() => (data ? homeSeedEntries(data) : []), [data]);
  return <QueryHydration entries={entries}>{children}</QueryHydration>;
}
