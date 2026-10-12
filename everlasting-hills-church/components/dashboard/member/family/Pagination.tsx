"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The page numbers to show: always the first and last, the current page with
 * one either side, and a gap ("…") wherever pages are skipped.
 * pageWindow(6, 12) → [1, "…", 5, 6, 7, "…", 12]
 */
export function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  // Near either end, show enough pages that a single skipped number is never hidden behind "…".
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const cell =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors";

export function Pagination({
  page,
  pages,
  onChange,
  label = "Pages",
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
        className={`${cell} border-[#E7CDD3] text-[#5A4A4D] hover:bg-[#FFF4F6] disabled:opacity-40 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.06]`}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {pageWindow(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-sm text-[#8a7e80] dark:text-white/40">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`${cell} ${
              p === page
                ? "border-[#87102C] bg-[#87102C] text-white"
                : "border-[#E7CDD3] text-[#5A4A4D] hover:bg-[#FFF4F6] dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.06]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
        className={`${cell} border-[#E7CDD3] text-[#5A4A4D] hover:bg-[#FFF4F6] disabled:opacity-40 dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.06]`}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
