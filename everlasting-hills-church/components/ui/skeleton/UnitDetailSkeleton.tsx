function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

export default function UnitDetailSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-white/8 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Block className="h-4 w-40" />
          <Block className="h-3 w-56" />
          <Block className="h-3 w-32" />
        </div>
        <Block className="h-8 w-8 rounded-lg flex-shrink-0" />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Block className="h-3 w-24" />
          <Block className="h-3 w-20" />
        </div>

        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
            >
              <Block className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Block className="h-3 w-32" />
                <Block className="h-2.5 w-40" />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Block className="h-6 w-6 rounded-lg" />
                <Block className="h-6 w-6 rounded-lg" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
