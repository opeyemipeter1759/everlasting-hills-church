"use client";

import { Check, Minus } from "lucide-react";

/**
 * A box in the church's colours rather than the browser's blue. The real input
 * stays underneath for the keyboard and for screen readers.
 */
export function RowCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const marked = checked || indeterminate;
  return (
    <label className="relative inline-flex cursor-pointer items-center" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[#87102C]/30 peer-focus-visible:ring-offset-1",
          marked
            ? "border-[#87102C] bg-[#87102C] text-white"
            : "border-gray-300 bg-white hover:border-[#87102C]/50 dark:border-white/20 dark:bg-white/5",
        ].join(" ")}
      >
        {indeterminate && !checked && <Minus size={12} strokeWidth={3} />}
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
    </label>
  );
}
