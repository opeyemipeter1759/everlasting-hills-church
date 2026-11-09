import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";

/** The admin dashboard while it loads, when it fails, and before anything is recorded. */

export function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard…</span>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-8 py-16 text-center dark:border-red-500/20 dark:bg-red-500/10">
      <AlertTriangle size={28} className="mb-3 text-red-500 dark:text-red-400" aria-hidden="true" />
      <p className="text-base font-semibold text-red-800 dark:text-red-300">Couldn&apos;t load the dashboard</p>
      <p className="mt-1 max-w-md text-sm text-red-600/80 dark:text-red-400/70">
        {message ?? "Something went wrong while fetching the data."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
      >
        <RefreshCw size={15} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7CDD3]/60 bg-white px-8 py-16 text-center dark:border-white/[0.09] dark:bg-white/[0.05]">
      <LayoutDashboard size={28} className="mb-3 text-[#87102C]/40 dark:text-[#FFB3C1]/40" aria-hidden="true" />
      <p className="text-base font-semibold text-[#111] dark:text-white">No dashboard data yet</p>
      <p className="mt-1 max-w-md text-sm text-[#8a7e80] dark:text-white/45">
        Metrics will appear here as members, attendance and activity are recorded.
      </p>
    </div>
  );
}
