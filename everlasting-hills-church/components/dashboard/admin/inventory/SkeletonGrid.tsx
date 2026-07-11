export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden animate-pulse"
        >
          <div className="h-32 bg-gray-200 dark:bg-white/10" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
