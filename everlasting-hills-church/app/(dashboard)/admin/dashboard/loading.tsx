/**
 * Route-level loading skeleton shown during navigation to /admin/dashboard,
 * before the client component mounts and runs its own loading state.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard…</span>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-7 w-56 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-44 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
        <div className="h-44 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
    </div>
  );
}
