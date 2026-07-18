import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
}

export default function CourseFilters({ search, onSearchChange }: Props) {
  return (
    <div className="relative max-w-md">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search courses…"
        className="w-full rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />
    </div>
  );
}
