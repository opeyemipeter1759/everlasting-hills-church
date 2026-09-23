import type { CSSProperties } from "react";

function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div style={style} className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />;
}

/** The funnel list while it loads: title, the stage chips, then the table. */
export default function Loading() {
  return (
    <div className="space-y-5 md:px-2" role="status" aria-label="Loading the funnel">
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <Bone className="h-3 w-40" />
        <div className="flex items-center gap-2.5">
          <Bone className="h-10 w-10 rounded-2xl" />
          <Bone className="h-7 w-52" />
        </div>
        <Bone className="h-4 w-72" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[88, 104, 112, 104, 84, 100, 104].map((width, i) => (
          <Bone key={i} className="h-10 rounded-xl" style={{ width }} />
        ))}
      </div>

      <Bone className="h-14 w-full rounded-2xl" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
        {Array.from({ length: 8 }).map((_, i) => (
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
