import Link from "next/link";
import type { EventSummary } from "@/types";
import { TZ } from "./constants";
import { eventChips, focusRing } from "./event-card-utils";

/** Date tile beside the title, theme line, and chips. */
export default function EventCardHeading({ event, href, compact = false }: { event: EventSummary; href: string; compact?: boolean }) {
  const start = new Date(event.startAt);
  const weekday = start.toLocaleDateString("en-GB", { weekday: "short", timeZone: TZ });
  const dayNum = start.toLocaleDateString("en-GB", { day: "numeric", timeZone: TZ });
  const monthShort = start.toLocaleDateString("en-GB", { month: "short", timeZone: TZ });
  const subtitle = event.theme || event.tagline;
  const chips = eventChips(event);

  return (
    <div className={`flex items-start ${compact ? "gap-3" : "gap-5"}`}>
      <div className={`flex flex-shrink-0 flex-col items-center rounded-md border border-[#ECE7E9] bg-[#F8F6F7] leading-none ${compact ? "w-[54px] py-2" : "w-[66px] py-2.5"}`}>
        <span className={`${compact ? "text-[10px] tracking-[0.1em]" : "text-[11px] tracking-[0.16em]"} font-semibold uppercase text-[#6B6B6B]`}>{weekday}</span>
        <span className={`${compact ? "mt-1 text-[24px]" : "mt-1.5 text-[30px]"} font-extrabold tracking-tight text-[#111]`}>{dayNum}</span>
        <span className={`${compact ? "mt-1 text-[10px] tracking-[0.1em]" : "mt-1.5 text-[11px] tracking-[0.16em]"} font-semibold uppercase text-[#6B6B6B]`}>{monthShort}</span>
      </div>

      <div className="min-w-0 pt-0.5">
        <h3 className={`${compact ? "text-base sm:text-lg" : "text-xl sm:text-[22px]"} font-extrabold uppercase leading-tight tracking-tight text-[#111] line-clamp-2`}>
          <Link href={href} className={`transition-colors hover:text-[#87102C] ${focusRing}`}>
            {event.title}
          </Link>
        </h3>
        {subtitle && <p className={`font-semibold uppercase text-[#87102C] ${compact ? "mt-1.5 text-[10px] tracking-[0.14em]" : "mt-2 text-xs tracking-[0.22em]"}`}>{subtitle}</p>}
        {chips.length > 0 && (
          <div className={`flex flex-wrap ${compact ? "mt-2 gap-1.5" : "mt-3 gap-2"}`}>
            {chips.map((chip) => (
              <span
                key={chip}
                className={`rounded-md border border-[#87102C]/20 bg-[#FFF5F7] font-bold uppercase text-[#87102C] ${compact ? "px-2 py-0.5 text-[9px] tracking-[0.06em]" : "px-2.5 py-1 text-[11px] tracking-[0.08em]"}`}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
