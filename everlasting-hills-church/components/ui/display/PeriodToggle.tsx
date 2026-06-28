"use client";

export type Period = "today" | "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week",  label: "Week"  },
  { id: "month", label: "Month" },
  { id: "year",  label: "Year"  },
];

interface PeriodToggleProps {
  value: Period;
  onChange: (p: Period) => void;
  className?: string;
}

export function PeriodToggle({ value, onChange, className = "" }: PeriodToggleProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 ${className}`}>
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
            value === p.id
              ? "bg-white dark:bg-[#2a2a2e] text-[#87102C] shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
