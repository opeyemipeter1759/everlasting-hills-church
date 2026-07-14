function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Block className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5">
            <Block className="h-3.5 w-28" />
            <Block className="h-3 w-36" />
          </div>
        </div>
        <Block className="h-4 w-14 rounded-full flex-shrink-0" />
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <Block className="h-3.5 w-10" />
        <div className="flex items-center gap-1">
          <Block className="h-7 w-7 rounded-lg" />
          <Block className="h-7 w-7 rounded-lg" />
          <Block className="h-7 w-7 rounded-lg" />
          <Block className="h-7 w-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ServicesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}
