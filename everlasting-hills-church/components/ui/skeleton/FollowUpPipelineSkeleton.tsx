function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5">
      <Block className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Block className="h-3.5 w-32" />
          <Block className="h-4 w-16 rounded-full" />
        </div>
        <Block className="h-3 w-24" />
      </div>
      <div className="hidden sm:flex items-center gap-2 w-40 flex-shrink-0">
        <Block className="h-7 w-7 rounded-full" />
        <Block className="h-3 w-20" />
      </div>
      <Block className="hidden md:block h-5 w-20 rounded-full flex-shrink-0" />
      <Block className="hidden lg:block h-3 w-16 flex-shrink-0" />
      <Block className="hidden sm:block h-3 w-10 flex-shrink-0" />
    </div>
  );
}

export default function FollowUpPipelineSkeleton() {
  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Block className="h-6 w-52" />
            <Block className="h-5 w-24 rounded-full" />
          </div>
          <Block className="h-3 w-72" />
        </div>
        <Block className="h-9 w-40 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5"
          >
            <Block className="h-10 w-10 rounded-xl mb-4" />
            <Block className="h-6 w-10 mb-1.5" />
            <Block className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Block className="h-8 w-24 rounded-lg" />
          <Block className="h-8 w-28 rounded-lg" />
          <Block className="h-8 w-44 rounded-lg" />
        </div>
      </div>

      {/* Master list */}
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
        {Array.from({ length: 6 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
