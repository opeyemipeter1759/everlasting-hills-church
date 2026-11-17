"use client";

import { useId } from "react";
import { lagosToday } from "@/lib/first-timer/visit-day";

/** A church-local date, never after today: the native picker, which is the easiest one on a phone. */
export function VisitDayField({
  label,
  value,
  onChange,
  min,
  error,
}: {
  label: string;
  value: string;
  onChange: (day: string) => void;
  min?: string;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white/75">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={lagosToday()}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#111] focus:outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:[color-scheme:dark]"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
