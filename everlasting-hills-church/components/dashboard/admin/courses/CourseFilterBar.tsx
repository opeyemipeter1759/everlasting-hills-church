import { Search } from "lucide-react";

export default function CourseFilterBar({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  return (
    <div className="relative max-w-md">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search courses by title or category…"
        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] py-2.5 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#87102C]/30"
      />
    </div>
  );
}
