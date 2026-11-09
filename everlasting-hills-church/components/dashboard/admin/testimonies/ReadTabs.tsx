import { Mail, MailOpen } from "lucide-react";
import type { TestimonyFilterState } from "./useTestimonyFilters";

/** Unread / Read — new testimonies land in Unread until an admin marks them read. */
export default function ReadTabs({ f }: { f: TestimonyFilterState }) {
  const tabs = [
    { value: "UNREAD", label: "Unread", count: f.unreadCount, Icon: Mail },
    { value: "READ", label: "Read", count: f.readCount, Icon: MailOpen },
  ] as const;

  return (
    <div role="tablist" aria-label="Read status" className="flex gap-1 border-b border-gray-200 dark:border-white/10">
      {tabs.map(({ value, label, count, Icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={f.readTab === value}
          onClick={() => f.setReadTab(value)}
          className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-bold transition-colors ${
            f.readTab === value
              ? "border-[#87102C] text-[#87102C] dark:border-[#e8768a] dark:text-[#e8768a]"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white"
          }`}
        >
          <Icon size={14} /> {label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
              f.readTab === value ? "bg-[#87102C] text-white" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60"
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
