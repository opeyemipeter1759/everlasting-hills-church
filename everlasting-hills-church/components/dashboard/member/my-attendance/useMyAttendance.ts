"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { attendanceStats, EMPTY_FILTERS, filterRows, toRows, type ColKey, type HistoryResponse } from "./attendance-data";

export const PAGE_SIZE = 8;

/**
 * The member's attendance history (one request), with column filters and
 * paging done in the browser on the rows already loaded.
 */
export function useMyAttendance() {
  const { data, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["attendance", "me", "history"],
    queryFn: async () => (await apiClient.get<HistoryResponse>("/attendance/me/history")).data,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const setFilter = (key: ColKey, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const allRows = useMemo(() => toRows(data), [data]);
  const rows = useMemo(() => filterRows(allRows, filters), [allRows, filters]);
  const stats = useMemo(() => attendanceStats(allRows), [allRows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [rows, safePage]);

  return { rows, pagedRows, stats, filters, setFilter, page: safePage, pageCount, setPage, isLoading, isFetching, refetch };
}
