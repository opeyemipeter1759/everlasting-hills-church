/**
 * Admin sermon list skeleton.
 */
export default function Loading() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-white/8 last:border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-3/5 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-2/5 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-5 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
