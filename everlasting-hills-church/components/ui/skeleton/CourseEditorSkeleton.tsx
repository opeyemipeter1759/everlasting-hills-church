function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-white/10 rounded animate-pulse ${className}`} />;
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-5 space-y-3">
      <Block className="h-3 w-24" />
      {Array.from({ length: lines }).map((_, i) => (
        <Block key={i} className="h-9 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CourseEditorSkeleton() {
  return (
    <div className="max-w-5xl space-y-5">
      <Block className="h-4 w-24" />
      <div className="space-y-2">
        <Block className="h-3 w-24" />
        <Block className="h-6 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-5">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={2} />
          <SectionSkeleton lines={2} />
          <SectionSkeleton lines={3} />
        </div>

        <div className="space-y-4">
          <Block className="h-52 w-full rounded-2xl" />
          <Block className="h-24 w-full rounded-2xl" />
          <Block className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
