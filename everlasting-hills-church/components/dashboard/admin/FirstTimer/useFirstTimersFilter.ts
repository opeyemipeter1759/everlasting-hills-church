import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminFirstTimers } from "@/lib/api/first-timers-admin";
import { useMonthYearParams } from "@/components/dashboard/follow-up/v2/MonthYearFilter";
import { useDebounced } from "@/components/dashboard/follow-up/MasterListToolbar";
import { useFirstTimersMode } from "./mode";

export type InterestFilter = "all" | "yes" | "no";

export const PAGE_SIZE_OPTIONS = [8, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 8;

/**
 * The filters on the admin First Timers page. Searching, filtering and paging
 * all happen on the server, which sends back the page and every count beside
 * it, so the tabs add up to All and nothing is counted in the browser. The
 * month and year come from the address, like every first-timer list.
 */
export function useFirstTimersFilter() {
  const queryClient = useQueryClient();
  const { listPath } = useFirstTimersMode();
  const { year, month } = useMonthYearParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InterestFilter>("all");
  // Inclusive "YYYY-MM-DD" bounds on the day the form came in. Empty means unbounded.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const settledSearch = useDebounced(search);

  // Any change of filter starts again at the first page.
  const filterKey = JSON.stringify([settledSearch, filter, fromDate, toDate, year, month, pageSize]);
  useEffect(() => setPage(1), [filterKey]);

  const { data, isLoading } = useAdminFirstTimers({
    search: settledSearch.trim() || undefined,
    interest: filter === "all" ? undefined : filter,
    from: fromDate || undefined,
    to: toDate || undefined,
    year,
    month,
    take: pageSize,
    skip: (page - 1) * pageSize,
  }, listPath);

  /** After an account is made, a record archived or edited: re-read the page and its counts. */
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["visitors"] });
  const counts = data?.counts;

  return {
    handleCreated: refresh,
    handleDeleted: refresh,
    handleUpdated: refresh,
    data,
    isLoading,
    search,
    setSearch,
    filter,
    setFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearDates: () => {
      setFromDate("");
      setToDate("");
    },
    pagedRows: data?.rows ?? [],
    page,
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)),
    setPage,
    pageSize,
    setPageSize,
    filterTabs: [
      { key: "all" as const, label: "All", count: counts?.all ?? 0 },
      { key: "yes" as const, label: "Interested", count: counts?.interested ?? 0 },
      { key: "no" as const, label: "Not yet", count: counts?.notYet ?? 0 },
    ],
    /** Everyone matching every filter: what the list pages through. */
    shown: data?.total ?? 0,
    /** Everyone matching the filters except interest: the All tab. */
    total: counts?.all ?? 0,
  };
}
