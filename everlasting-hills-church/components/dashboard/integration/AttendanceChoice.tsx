"use client";

export type Attendance = "everyone" | "came" | "missed";

const OPTIONS: { value: Attendance; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "came", label: "Came" },
  { value: "missed", label: "Missed it" },
];

/** For the service picked: show everyone, only who came, or only who missed it. */
export function AttendanceChoice({ value, onChange }: { value: Attendance; onChange: (next: Attendance) => void }) {
  return (
    <div role="radiogroup" aria-label="Attendance at this service" className="flex h-10 rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.05]">
      {OPTIONS.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-3 text-sm font-medium transition-colors sm:flex-none ${
              on ? "bg-[#87102C] text-white" : "text-gray-600 hover:bg-gray-100 dark:text-white/65 dark:hover:bg-white/10"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
