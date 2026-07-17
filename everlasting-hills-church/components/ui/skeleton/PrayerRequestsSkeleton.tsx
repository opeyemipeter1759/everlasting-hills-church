function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function PrayerRequestsSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-3 w-28" />
          <Block className="h-7 w-48" />
          <Block className="h-3 w-72 max-w-full" />
        </div>
        <Block className="h-8 w-24 rounded-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Block className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Block className="h-3.5 w-32" />
                <Block className="h-3 w-20" />
              </div>
            </div>
            <Block className="h-3 w-full" />
            <Block className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
