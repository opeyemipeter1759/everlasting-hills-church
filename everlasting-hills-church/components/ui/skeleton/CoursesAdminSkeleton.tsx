function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CoursesAdminSkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-3 w-20" />
          <Block className="h-6 w-44" />
          <Block className="h-3 w-96" />
        </div>
        <Block className="h-10 w-32 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Block className="h-10 w-10 rounded-xl flex-shrink-0" />
                <div className="space-y-1.5">
                  <Block className="h-3.5 w-32" />
                  <Block className="h-3 w-44" />
                </div>
              </div>
              <Block className="h-8 w-16 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
