"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { VisitorRow } from "@/components/dashboard/admin/FirstTimer/types";

export interface AdminFirstTimerQuery {
  search?: string;
  /** "yes": said they want membership; "no": everyone else. */
  interest?: "yes" | "no";
  /** Inclusive "YYYY-MM-DD" days the form came in. */
  from?: string;
  to?: string;
  /** The month and year of their first visit. */
  year?: number;
  month?: number;
  take: number;
  skip: number;
}

export interface AdminFirstTimerPage {
  rows: VisitorRow[];
  /** Everyone matching every filter: the length of the list being paged. */
  total: number;
  counts: {
    /** Everyone matching the filters except interest: interested plus notYet. */
    all: number;
    interested: number;
    notYet: number;
    onlineConfirmed: number;
    onlineNew: number;
  };
  /** The first-timer pipeline's total for the same month and year: the Follow Up page's figure. */
  onRecord: number;
}

/**
 * The admin First Timers page: a page of forms and every count beside it, all
 * worked out by the API. The First Timer Team reads the same list from its own
 * endpoint, which leaves out prayer requests.
 */
export function useAdminFirstTimers(q: AdminFirstTimerQuery, path = "/visitors/first-timers") {
  const params = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== ""));
  return useQuery({
    queryKey: ["visitors", "first-timers", path, params],
    queryFn: () => api.get<AdminFirstTimerPage>(path, params),
    enabled: typeof window !== "undefined",
    placeholderData: keepPreviousData,
  });
}
