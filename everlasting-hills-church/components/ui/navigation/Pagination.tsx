"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  if (page > 3) pages.push("ellipsis");
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < pageCount - 2) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}

/** Compact numbered pagination with prev/next arrows and ellipsis truncation. */
export function Pagination({ page, pageCount, onPageChange, className = "" }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = getPageNumbers(page, pageCount);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7CDD3] dark:border-white/10 text-[#87102C] dark:text-white/70 transition-colors hover:bg-[#FFF4F6] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1.5 text-xs text-[#8a7e80] dark:text-white/30">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums transition-colors ${
              p === page
                ? "bg-[#87102C] text-white"
                : "text-[#555] dark:text-white/60 hover:bg-[#FFF4F6] dark:hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7CDD3] dark:border-white/10 text-[#87102C] dark:text-white/70 transition-colors hover:bg-[#FFF4F6] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
