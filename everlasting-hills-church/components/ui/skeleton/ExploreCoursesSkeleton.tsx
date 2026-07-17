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
          <Block className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreCoursesSkeleton() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="rounded-2xl bg-gray-100 dark:bg-white/5 p-9">
        <Block className="mb-3 h-3 w-32" />
        <Block className="mb-2 h-8 w-72" />
        <Block className="mb-6 h-4 w-96" />
        <div className="flex gap-2">
          <Block className="h-9 w-28 rounded-full" />
          <Block className="h-9 w-28 rounded-full" />
          <Block className="h-9 w-28 rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        <Block className="h-11 w-full max-w-md rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
