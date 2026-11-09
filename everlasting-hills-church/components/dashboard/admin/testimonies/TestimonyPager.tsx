import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "./shared";
import type { TestimonyFilterState } from "./useTestimonyFilters";

/** "Showing 1–10 of 42", page buttons and rows-per-page. Hidden when nothing matches. */
export default function TestimonyPager({ f }: { f: TestimonyFilterState }) {
  const { page, pageSize, filtered } = f;
  if (filtered.length === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-xs text-gray-400 dark:text-white/40 order-2 sm:order-1">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
      </p>
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <Pagination page={page} pageCount={f.pageCount} onPageChange={f.setPage} />
        <Select
          aria-label="Rows per page"
          value={String(pageSize)}
          onChange={(v) => { f.setPageSize(Number(v)); f.setPage(1); }}
          className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
          options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
        />
      </div>
    </div>
  );
}
