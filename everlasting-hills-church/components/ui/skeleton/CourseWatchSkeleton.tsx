function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CourseWatchSkeleton() {
  return (
    <div className="max-w-[1400px] space-y-4">
      <Block className="h-4 w-40" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-4">
          <Block className="aspect-video w-full rounded-2xl" />
          <div className="space-y-2">
            <Block className="h-3 w-32" />
            <Block className="h-6 w-2/3" />
            <Block className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            <Block className="h-11 flex-1 rounded-xl" />
            <Block className="h-11 flex-1 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-2">
            <Block className="h-3 w-32" />
            <Block className="h-3 w-full" />
            <Block className="h-3 w-5/6" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 space-y-3">
          <Block className="h-3 w-16" />
          <Block className="h-4 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Block className="h-3.5 w-3.5 flex-shrink-0 rounded-full" />
              <Block className="h-3 flex-1" />
              <Block className="h-3 w-8 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
