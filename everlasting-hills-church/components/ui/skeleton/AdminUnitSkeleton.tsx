export default function AdminUnitSkeleton() {
  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-3 min-h-[300px] rounded-xl border border-dashed border-gray-200 dark:border-white/10" />
    </div>
  );
}