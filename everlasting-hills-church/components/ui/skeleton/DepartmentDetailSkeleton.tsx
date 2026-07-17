function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      {children}
    </section>
  );
}

export default function DepartmentDetailSkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Block className="h-9 w-9 rounded-lg flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Block className="h-5 w-20 rounded-lg" />
          <Block className="h-7 w-56" />
          <Block className="h-3.5 w-72" />
          <div className="flex items-center gap-4 pt-1">
            <Block className="h-3 w-16" />
            <Block className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Admin head */}
      <SectionCard>
        <div className="mb-3 flex items-center gap-2">
          <Block className="h-4 w-4 rounded" />
          <Block className="h-3 w-24" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Block className="h-11 w-11 rounded-full" />
            <div className="space-y-1.5">
              <Block className="h-4 w-32" />
              <Block className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Block className="h-9 w-24 rounded-xl" />
            <Block className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </SectionCard>

      {/* Units */}
      <SectionCard>
        <div className="mb-3 flex items-center gap-2">
          <Block className="h-4 w-4 rounded" />
          <Block className="h-3 w-14" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3"
            >
              <div className="space-y-1.5">
                <Block className="h-3.5 w-32" />
                <Block className="h-3 w-40" />
              </div>
              <Block className="h-3 w-16" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Announcement composer */}
      <SectionCard>
        <div className="mb-3 flex items-center gap-2">
          <Block className="h-4 w-4 rounded" />
          <Block className="h-3 w-52" />
        </div>
        <div className="space-y-2.5">
          <Block className="h-10 w-full rounded-xl" />
          <Block className="h-20 w-full rounded-xl" />
          <Block className="h-9 w-40 rounded-xl" />
        </div>
      </SectionCard>

      {/* Succession history */}
      <SectionCard>
        <div className="mb-3 flex items-center gap-2">
          <Block className="h-4 w-4 rounded" />
          <Block className="h-3 w-36" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5">
              <Block className="h-[30px] w-[30px] rounded-full flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Block className="h-3 w-28" />
                <Block className="h-2.5 w-44" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
