"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { StatusCounts } from "@/lib/api/pipeline";

/** A team member's own follow-up: who they have, and what they have logged. */
export interface MyFollowUpActivity {
  /** When "this month" starts, as an ISO instant. */
  month: string;
  assigned: { total: number; active: number; counts: StatusCounts & { all: number } };
  waitingFirstContact: number;
  contacts: { allTime: number; thisMonth: number; reachedThisMonth: number; byMethodThisMonth: Record<string, number> };
  firstContactsThisMonth: number;
  integrationRequests: { pending: number; approved: number; changesRequested: number };
}

export function useMyFollowUpActivity(enabled = true) {
  return useQuery({
    queryKey: ["follow-up", "my-activity"],
    queryFn: () => api.get<MyFollowUpActivity>("/follow-up/my-activity"),
    enabled: enabled && typeof window !== "undefined",
  });
}
