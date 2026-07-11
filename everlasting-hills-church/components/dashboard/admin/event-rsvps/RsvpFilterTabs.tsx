export type RsvpFilter = "all" | "member" | "new";

export default function RsvpFilterTabs({
  filter,
  onChange,
  counts,
}: {
  filter: RsvpFilter;
  onChange: (f: RsvpFilter) => void;
  counts: { all: number; member: number; new: number };
}) {
  const tabs: { key: RsvpFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "new", label: "New", count: counts.new },
    { key: "member", label: "Members", count: counts.member },
  ];
  return (
    <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden text-xs font-semibold w-fit">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`px-3.5 py-2 flex items-center gap-1.5 transition-colors ${
            filter === t.key
              ? "bg-[#87102C] text-white"
              : "bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          {t.label}
          <span className={`text-[10px] ${filter === t.key ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}
