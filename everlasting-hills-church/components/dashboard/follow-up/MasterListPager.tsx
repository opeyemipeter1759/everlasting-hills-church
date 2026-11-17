"use client";

import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";

export const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Paging for a server-paged list: which rows are showing out of the API's
 * total, the pages, and how many rows a page holds. `page` counts from 0.
 */
export function MasterListPager({
  total,
  page,
  pageSize,
  busy,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  busy?: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  if (total === 0) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="order-2 text-xs text-gray-500 dark:text-white/45 sm:order-1">
        Showing {from} to {to} of {total}
        {busy && <span className="ml-1 opacity-60">updating</span>}
      </p>
      <div className="order-1 flex flex-wrap items-center gap-3 sm:order-2">
        {/* The shared pagination counts pages from 1; this list from 0. */}
        <Pagination page={page + 1} pageCount={pageCount} onPageChange={(next) => onPage(next - 1)} />
        <Select
          aria-label="Rows per page"
          value={String(pageSize)}
          onChange={(v) => onPageSize(Number(v))}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
          options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / page` }))}
        />
      </div>
    </div>
  );
}
