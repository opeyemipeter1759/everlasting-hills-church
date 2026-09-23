"use client";

import { Check } from "lucide-react";
import type { SelectOption } from "./types";

/** One row of the open panel: dot, label, count, tick. */
export function SelectOptionRow({
  option,
  id,
  index,
  selected,
  highlighted,
  onHighlight,
  onCommit,
}: {
  option: SelectOption;
  id: string;
  index: number;
  selected: boolean;
  highlighted: boolean;
  onHighlight: () => void;
  onCommit: () => void;
}) {
  return (
    <div
      id={id}
      data-index={index}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      onMouseEnter={() => !option.disabled && onHighlight()}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onCommit}
      className={[
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        option.disabled
          ? "cursor-not-allowed text-[#8a7e80]/50 dark:text-white/25"
          : "cursor-pointer text-[#111] dark:text-white/85",
        highlighted && !option.disabled ? "bg-[#FFF4F6] dark:bg-white/[0.07]" : "",
        selected ? "font-semibold" : "font-medium",
      ].join(" ")}
    >
      {option.swatch && <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${option.swatch}`} />}
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {option.hint && (
        <span className="flex-shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-white/10 dark:text-white/50">
          {option.hint}
        </span>
      )}
      <Check
        size={15}
        aria-hidden="true"
        className={`flex-shrink-0 text-[#87102C] dark:text-[#FFB3C1] ${selected ? "" : "invisible"}`}
      />
    </div>
  );
}
