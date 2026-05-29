/**
 * Loading state for /sermons.
 *
 * Next.js automatically renders this while the Server Component is fetching.
 * Skeleton card grid matches the real layout to minimize visual jump on hydrate.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-12 px-5 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded mb-3 animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-white/10 rounded mb-10 animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="aspect-video bg-gray-200 dark:bg-white/5 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-full bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
