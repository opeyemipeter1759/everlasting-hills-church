import { SkeletonBlock } from "@/components/ui/display/SkeletonBlock";

function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <SkeletonBlock className="h-9 w-9 rounded-xl" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="mt-3.5 h-4 w-4/5" />
      <div className="mt-2 space-y-1.5">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-2/3" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/[0.06] pt-3">
        <SkeletonBlock className="h-2.5 w-24" />
        <SkeletonBlock className="h-2.5 w-8" />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <SkeletonBlock className="h-7 flex-1 rounded-lg" />
        <SkeletonBlock className="h-7 w-7 rounded-lg" />
        <SkeletonBlock className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}

/** Loading state for ReportsPageShell — mirrors the loaded page's exact shape
 * (header, five stat tiles, target pills, 3-up card grid) so the whole page
 * reads as "loading", not just a stray spinner in the list area. */
export default function ReportsListSkeleton({ withTargetPills = false }: { withTargetPills?: boolean }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="mt-0.5 h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-4">
            <SkeletonBlock className="h-9 w-9 rounded-xl" />
            <SkeletonBlock className="mt-3 h-6 w-10" />
            <SkeletonBlock className="mt-1.5 h-2.5 w-14" />
          </div>
        ))}
      </div>

      {withTargetPills && (
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-7 w-24 rounded-full" />
          <SkeletonBlock className="h-7 w-28 rounded-full" />
        </div>
      )}

      {/* List */}
      <div>
        <SkeletonBlock className="mb-3 h-3 w-20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} delay={i * 60} />
          ))}
        </div>
      </div>
    </div>
  );
}
