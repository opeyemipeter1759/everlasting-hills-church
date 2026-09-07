"use client";

import type { CalendarItem } from "./calendar-grid-utils";
import { formatTime } from "./calendar-grid-utils";

const KIND_STYLE: Record<CalendarItem["kind"], string> = {
  service: "border-l-[#87102C] bg-[#FFE8ED] hover:bg-[#FFD6E0] dark:bg-[#87102C]/25 dark:hover:bg-[#87102C]/40",
  event: "border-l-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-400/15 dark:hover:bg-amber-400/25",
  gathering: "border-l-[#8a7e80] bg-[#F6F1F2] hover:bg-[#EFE7E9] dark:border-l-white/30 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
  personal: "border-l-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-400/15 dark:hover:bg-blue-400/25",
};

/** One item on the grid. Colour-coded by source so a member can tell church items from their own at a glance. */
export default function MemberEventChip({ item, showTime = true }: { item: CalendarItem; showTime?: boolean }) {
  const title = `${item.title}${item.location ? ` · ${item.location}` : ""}${item.cancelled ? " (cancelled)" : ""}`;
  const content = (
    <span
      className={[
        "group flex items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-left transition-colors w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40",
        KIND_STYLE[item.kind],
        item.cancelled ? "opacity-50" : "",
      ].join(" ")}
    >
      <span
        className={[
          "min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-[#111] dark:text-white",
          item.cancelled ? "line-through" : "",
        ].join(" ")}
      >
        {showTime && <span className="mr-1 font-normal text-[#8a7e80] dark:text-white/45">{formatTime(item.start)}</span>}
        {item.title}
      </span>
      {item.servingRoles?.length ? (
        <span className="flex-shrink-0 rounded bg-[#87102C]/15 px-1 text-[9px] font-bold uppercase tracking-wide text-[#87102C] dark:bg-white/10 dark:text-[#FFB3C1]">
          Serving
        </span>
      ) : null}
    </span>
  );

  if (item.htmlLink) {
    return (
      <a href={item.htmlLink} target="_blank" rel="noopener noreferrer" title={title} className="block">
        {content}
      </a>
    );
  }

  return (
    <span title={title} className="block">
      {content}
    </span>
  );
}
