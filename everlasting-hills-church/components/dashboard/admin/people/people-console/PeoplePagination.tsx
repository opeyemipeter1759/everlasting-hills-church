import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DirectoryMeta } from "@/lib/api/people";
import { pagerBtn } from "./constants";
import { Select } from "@/components/ui/select";

export default function PeoplePagination({
  meta,
  onLimitChange,
  onPrev,
  onNext,
}: {
  meta: DirectoryMeta;
  onLimitChange: (limit: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (meta.total <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-gray-500 dark:text-white/50">
        Showing{" "}
        <span className="font-semibold text-gray-700 dark:text-white">
          {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
        </span>{" "}
        of <span className="font-semibold text-gray-700 dark:text-white">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Select
          value={String(meta.limit)}
          onChange={(v) => onLimitChange(Number(v))}
          aria-label="Rows per page"
          className="text-xs rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-700 dark:text-white/70 focus:outline-none"
          options={[25, 50, 100, 200].map((n) => ({ value: String(n), label: `${n} / page` }))}
        />
        <button type="button" disabled={meta.page <= 1} onClick={onPrev} className={pagerBtn}>
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-gray-600 dark:text-white/60 tabular-nums">
          {meta.page} / {meta.totalPages || 1}
        </span>
        <button type="button" disabled={meta.page >= meta.totalPages} onClick={onNext} className={pagerBtn}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
