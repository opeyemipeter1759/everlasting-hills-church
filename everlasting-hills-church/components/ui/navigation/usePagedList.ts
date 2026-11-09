"use client";

import { useEffect, useState } from "react";

/**
 * Pages through a list that is already loaded in full.
 *
 * `resetKey` is anything that changes what the list contains (filters, search,
 * view): when it changes the list goes back to page 1. If the list shrinks
 * below the current page, the page is pulled back to the last one.
 */
export function usePagedList<T>(items: T[], { pageSize: initialPageSize = 25, resetKey = "" }: { pageSize?: number; resetKey?: string } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [resetKey]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return {
    page,
    pageSize,
    pageCount,
    total: items.length,
    items: items.slice((page - 1) * pageSize, page * pageSize),
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  };
}

export type PagedList<T> = ReturnType<typeof usePagedList<T>>;
