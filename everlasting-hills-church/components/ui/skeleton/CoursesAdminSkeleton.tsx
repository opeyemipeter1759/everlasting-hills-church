function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CoursesAdminSkeleton() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-3 w-20" />
          <Block className="h-6 w-44" />
          <Block className="h-3 w-96" />
        </div>
        <Block className="h-10 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4">
            <Block className="h-9 w-9 rounded-xl mb-3" />
            <Block className="h-2.5 w-16" />
            <Block className="mt-1.5 h-5 w-10" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Block className="h-10 flex-1 min-w-[220px] rounded-xl" />
        <Block className="h-8 w-20 rounded-full" />
        <Block className="h-8 w-24 rounded-full" />
        <Block className="h-8 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
            <Block className="h-32 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Block className="h-2.5 w-16" />
              <Block className="h-3.5 w-32" />
              <Block className="h-3 w-full" />
              <Block className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
