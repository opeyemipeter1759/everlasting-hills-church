"use client";

import { createPortal } from "react-dom";
import type { RefObject } from "react";
import type { AnchoredRect } from "../useAnchoredPosition";
import { SelectOptionRow } from "./SelectOptionRow";
import type { SelectOption } from "./types";

/**
 * The open panel. It is portalled to <body> with fixed positioning so no
 * drawer, modal or overflow-hidden table can clip it, and flips above the
 * trigger when the room below runs out — what the native popup would do.
 */
export function SelectListbox({
  listboxId,
  listRef,
  rect,
  openUp,
  options,
  value,
  highlight,
  onHighlight,
  onCommit,
}: {
  listboxId: string;
  listRef: RefObject<HTMLUListElement>;
  rect: AnchoredRect;
  openUp: boolean;
  options: SelectOption[];
  value: string;
  highlight: number;
  onHighlight: (index: number) => void;
  onCommit: (index: number) => void;
}) {
  return createPortal(
    <ul
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-activedescendant={highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined}
      style={{
        position: "fixed",
        left: rect.left,
        minWidth: rect.width,
        maxWidth: Math.max(rect.width, 320),
        ...(openUp ? { bottom: window.innerHeight - rect.triggerTop + 6 } : { top: rect.triggerBottom + 6 }),
      }}
      className="z-[60] max-h-72 overflow-y-auto rounded-xl border border-gray-200/90 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] dark:border-white/[0.1] dark:bg-[#1c1c1e] dark:shadow-black/50"
    >
      {options.length === 0 && (
        <li className="px-3 py-2 text-sm text-[#8a7e80] dark:text-white/40">Nothing to choose from</li>
      )}
      {options.map((option, i) => (
        <li key={`${option.value}-${i}`}>
          {option.group && option.group !== options[i - 1]?.group && (
            <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8a7e80] dark:text-white/35">
              {option.group}
            </p>
          )}
          <SelectOptionRow
            option={option}
            id={`${listboxId}-opt-${i}`}
            index={i}
            selected={option.value === value}
            highlighted={i === highlight}
            onHighlight={() => onHighlight(i)}
            onCommit={() => onCommit(i)}
          />
        </li>
      ))}
    </ul>,
    document.body,
  );
}
