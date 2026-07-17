function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CourseAdminDetailSkeleton() {
  return (
    <div className="max-w-3xl space-y-5">
      <Block className="h-4 w-24" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618]">
        <Block className="h-32 w-full rounded-none" />
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Block className="h-2.5 w-20" />
            <Block className="h-6 w-1/2" />
            <Block className="h-3 w-2/3" />
          </div>
          <Block className="h-3 w-full" />
          <Block className="h-3 w-5/6" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} className="h-3 w-16" />
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Block key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Block className="h-11 flex-1 rounded-xl" />
            <Block className="h-11 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
