"use client";

/** Placeholder rows while the table loads. */
export function TableSkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td colSpan={cols} className="px-4 py-3.5">
            <div className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function TableEmptyRow({ cols, title, body }: { cols: number; title: string; body: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-14 text-center">
        <p className="text-sm font-semibold text-[#111] dark:text-white">{title}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/45">{body}</p>
      </td>
    </tr>
  );
}

/** Stand-in messages while the thread loads. */
export function ThreadSkeleton() {
  return (
    <div className="space-y-3 px-3 py-2">
      {[40, 64, 52].map((width, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.06]" />
          <div className="flex-1 space-y-1.5 py-1">
            <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" style={{ width: `${width}%` }} />
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
