"use client";

import { useRef } from "react";
import { BarChart3, ClipboardList } from "lucide-react";

export type AttendanceTab = "attendance" | "insights";

const TABS: { id: AttendanceTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "attendance", label: "Attendance", icon: ClipboardList },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

export const tabId = (id: AttendanceTab) => `attendance-tab-${id}`;
export const panelId = (id: AttendanceTab) => `attendance-panel-${id}`;

/** The two halves of the page: taking attendance, and reading what it says. Arrow keys move between them. */
export default function AttendanceTabs({ value, onChange }: { value: AttendanceTab; onChange: (tab: AttendanceTab) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label="Attendance" className="flex gap-1 border-b border-gray-200 dark:border-white/10">
      {TABS.map((t, i) => {
        const on = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            id={tabId(t.id)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId(t.id)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              on
                ? "border-[#87102C] text-[#87102C] dark:border-[#E8768A] dark:text-[#E8768A]"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80"
            }`}
          >
            <Icon size={15} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
