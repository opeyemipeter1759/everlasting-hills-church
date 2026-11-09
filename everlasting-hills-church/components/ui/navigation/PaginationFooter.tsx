"use client";

import { Select } from "@/components/ui/select";
import { Pagination } from "./Pagination";

const DEFAULT_SIZES = [10, 25, 50, 100];

/**
 * "Showing 1–25 of 140", page buttons and rows-per-page, under a paged list.
 * Pairs with usePagedList: pass its result straight in. Hidden when the list is empty.
 */
export function PaginationFooter({ paged, pageSizeOptions = DEFAULT_SIZES, noun = "" }: {
  paged: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
  pageSizeOptions?: number[];
  /** What is being counted, e.g. "people" → "Showing 1–25 of 140 people". */
  noun?: string;
}) {
  const { page, pageSize, pageCount, total } = paged;
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="order-2 text-xs text-gray-400 dark:text-white/40 sm:order-1">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        {noun ? ` ${noun}` : ""}
      </p>
      <div className="order-1 flex items-center gap-3 sm:order-2">
        <Pagination page={page} pageCount={pageCount} onPageChange={paged.setPage} />
        <Select
          aria-label="Rows per page"
          value={String(pageSize)}
          onChange={(v) => paged.setPageSize(Number(v))}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
          options={pageSizeOptions.map((n) => ({ value: String(n), label: `${n} / page` }))}
        />
      </div>
    </div>
  );
}
