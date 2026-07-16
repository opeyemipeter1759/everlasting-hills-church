function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function CourseExamSkeleton() {
  return (
    <div className="max-w-2xl space-y-5">
      <Block className="h-4 w-32" />

      <div className="space-y-2">
        <Block className="h-3 w-40" />
        <Block className="h-6 w-80" />
        <Block className="h-3 w-56" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-2.5">
            <Block className="h-4 w-3/4" />
            {Array.from({ length: 4 }).map((_, oi) => (
              <Block key={oi} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>

      <Block className="h-12 w-full rounded-xl" />
    </div>
  );
}
