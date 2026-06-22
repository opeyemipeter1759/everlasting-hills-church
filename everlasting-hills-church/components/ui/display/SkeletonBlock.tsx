interface SkeletonProps { className?: string }

export function SkeletonBlock({ className = "h-4 w-full" }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-white/8 rounded-lg ${className}`} />;
}

export function SkeletonLines({ lines = 3, className = "h-3 w-full" }: { lines?: number; className?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-gray-200 dark:bg-white/8 rounded-lg ${className} ${i === lines - 1 ? "w-3/4" : ""}`} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-2.5">
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-2.5 w-20" />
        <SkeletonBlock className="h-6 w-6 rounded-lg" />
      </div>
      <SkeletonBlock className="h-8 w-20" />
      <SkeletonBlock className="h-2.5 w-28" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-[220px]" }: { height?: string }) {
  return (
    <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded-xl w-full ${height}`} />
  );
}
