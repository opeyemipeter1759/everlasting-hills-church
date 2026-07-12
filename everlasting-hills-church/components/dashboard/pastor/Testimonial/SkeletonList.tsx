export default function SkeletonList() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 animate-pulse"
        >
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="space-y-2 pl-4">
            <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
