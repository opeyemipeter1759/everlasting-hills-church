import type { CSSProperties } from "react";

function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div style={style} className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />;
}

/**
 * The shape of the Follow Up and Integration Team pages before their figures
 * arrive: the same header, cards, tabs, filters and table, drawn empty. It is
 * laid out to the real sizes so nothing jumps when the numbers land.
 */
export function BoardSkeleton() {
  return (
    <div className="space-y-4 md:px-5" role="status" aria-label="Loading the page">
      <span className="sr-only">Loading…</span>

      {/* The hero keeps its colour — only what it says is missing. */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#87102C] via-[#9B1435] to-[#5E0A1E] px-6 py-7 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="h-3 w-40 animate-pulse rounded bg-white/25" />
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/20" />
              <div className="h-7 w-44 animate-pulse rounded bg-white/25" />
            </div>
            <div className="h-4 w-64 animate-pulse rounded bg-white/20" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-xl bg-white/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gray-200 dark:bg-white/10" />
            <div className="flex items-start justify-between gap-3">
              <Bone className="h-10 w-10 rounded-xl" />
              <Bone className="mt-1 h-7 w-10 rounded-md" />
            </div>
            <Bone className="mt-3 h-4 w-28" />
            <Bone className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="flex gap-6 border-b border-gray-200 px-4 pb-3 pt-1 dark:border-white/10">
        {[96, 112, 80].map((width, i) => (
          <Bone key={i} className="h-4" style={{ width }} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-white/10 dark:bg-white/[0.03]">
        <Bone className="h-10 min-w-[13rem] flex-1 rounded-xl" />
        <Bone className="h-10 w-[12.5rem] rounded-xl" />
        <Bone className="h-10 w-[11.5rem] rounded-xl" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
        <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
          <Bone className="h-3 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-white/[0.06]">
            <Bone className="h-9 w-9 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-3.5 w-36" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="hidden h-3 w-28 sm:block" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
