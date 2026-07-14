function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Block className="h-3 w-20" />
          <Block className="h-7 w-16" />
          <Block className="h-3 w-24" />
        </div>
        <Block className="h-10 w-10 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

function PersonListSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5">
      <Block className="mb-4 h-3 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-2.5">
            <Block className="h-[34px] w-[34px] rounded-full flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Block className="h-3 w-28" />
              <Block className="h-2.5 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonthlyReviewSkeleton() {
  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-6 w-44" />
          <Block className="h-3 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Block className="h-9 w-9 rounded-lg" />
          <Block className="h-4 w-28" />
          <Block className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 p-6">
        <Block className="mb-3 h-3 w-32" />
        <Block className="mb-3 h-8 w-20" />
        <Block className="h-2 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PersonListSkeleton />
        <PersonListSkeleton />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5">
        <Block className="mb-4 h-3 w-28" />
        <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Block className="h-3 w-24" />
                <Block className="h-3 w-6" />
              </div>
              <Block className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
