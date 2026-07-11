import type { InterestFilter } from "./useFirstTimersFilter";

export default function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: InterestFilter; label: string; count: number }[];
  active: InterestFilter;
  onChange: (key: InterestFilter) => void;
}) {
  return (
    <div className="flex rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] overflow-hidden text-xs font-semibold">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
            active === tab.key
              ? "bg-[#87102C] text-white"
              : "bg-white dark:bg-transparent text-[#8a7e80] dark:text-white/45 hover:bg-[#FFF4F6] dark:hover:bg-white/[0.05]"
          }`}
        >
          {tab.label}
          <span
            className={`text-[10px] font-bold ${active === tab.key ? "text-white/60" : "text-[#b8a8ac] dark:text-white/25"}`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
