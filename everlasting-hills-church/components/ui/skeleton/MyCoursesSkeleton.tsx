function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
      <Block className="h-36 w-full rounded-none" />
      <div className="p-5 space-y-2">
        <Block className="h-3 w-20" />
        <Block className="h-4 w-40" />
        <Block className="h-3 w-full" />
        <div className="flex gap-4 border-t border-gray-100 dark:border-white/[0.06] pt-3">
          <Block className="h-3 w-14" />
          <Block className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function MyCoursesSkeleton() {
  return (
    <div className="max-w-6xl space-y-7 sm:space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Block className="mt-1.5 h-9 w-1 rounded-full" />
          <div className="space-y-2">
            <Block className="h-3 w-24" />
            <Block className="h-7 w-56" />
            <Block className="h-4 w-80" />
          </div>
        </div>
        <Block className="h-10 w-44 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Block className="col-span-2 row-span-2 h-56 rounded-2xl lg:h-auto" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-24 rounded-2xl sm:h-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
