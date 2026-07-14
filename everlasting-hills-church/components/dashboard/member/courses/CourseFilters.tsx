import { Search } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CourseFilters({ search, onSearchChange, categories, activeCategory, onCategoryChange }: Props) {
  return (
    <div className="space-y-3">
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

      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((c) => {
          const active = c === activeCategory;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCategoryChange(c)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "border-transparent bg-[#87102C] text-white"
                  : "border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 hover:border-[#87102C]/40 hover:text-[#87102C] dark:hover:text-[#e8768a]"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
