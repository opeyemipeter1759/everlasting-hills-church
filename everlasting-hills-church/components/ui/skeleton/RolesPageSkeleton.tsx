function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function RoleGroupSkeleton() {
  return (
    <div className="space-y-2">
      <Block className="h-3 w-20" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-2.5 py-2">
          <Block className="h-[26px] w-[26px] rounded-full flex-shrink-0" />
          <Block className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function RolesPageSkeleton() {
  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-3 w-28" />
          <Block className="h-7 w-24" />
          <Block className="h-3 w-96 max-w-full" />
        </div>
        <Block className="h-8 w-24 rounded-lg" />
      </div>

      {/* Role rollup */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-4">
            <Block className="h-8 w-8 rounded-lg mb-2.5" />
            <Block className="h-6 w-8 mb-1.5" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Global roles */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Block className="h-4 w-28" />
          <Block className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <RoleGroupSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
