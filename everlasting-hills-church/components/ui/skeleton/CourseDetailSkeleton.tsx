function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CourseDetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-6">
      <Block className="h-4 w-32" />

      <div className="rounded-2xl bg-gray-100 dark:bg-white/5 p-9 space-y-3">
        <div className="flex gap-2">
          <Block className="h-6 w-24 rounded-full" />
          <Block className="h-6 w-20 rounded-full" />
        </div>
        <Block className="h-8 w-2/3" />
        <Block className="h-4 w-1/2" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-3">
            <Block className="h-3 w-32" />
            <Block className="h-3 w-full" />
            <Block className="h-3 w-5/6" />
            <Block className="mt-3 h-3 w-32" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Block key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-3">
            <Block className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Block key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Block className="h-3 w-16" />
                <Block className="h-3 w-10" />
              </div>
            ))}
          </div>
          <Block className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
