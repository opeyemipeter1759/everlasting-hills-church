/**
 * Dashboard skeleton shown while /auth/me + role-specific data loads.
 *
 * One generic skeleton serves all three roles (member/unit-lead/admin) because they all
 * roughly follow: welcome banner → stat row → 2-col content. Close enough that role-specific
 * skeletons aren't worth maintaining separately.
 */
export default function Loading() {
  return (
    <div className="space-y-5 max-w-6xl">
      {/* Welcome banner skeleton */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-64 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Stat row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3"
          >
            <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* 2-col content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-4"
          >
            <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
