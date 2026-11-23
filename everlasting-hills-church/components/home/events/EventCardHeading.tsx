import Link from "next/link";
import type { EventSummary } from "@/types";
import { TZ } from "./constants";
import { eventChips, focusRing } from "./event-card-utils";

/** Date tile beside the title, theme line, and chips. */
export default function EventCardHeading({ event, href }: { event: EventSummary; href: string }) {
  const start = new Date(event.startAt);
  const weekday = start.toLocaleDateString("en-GB", { weekday: "short", timeZone: TZ });
  const dayNum = start.toLocaleDateString("en-GB", { day: "numeric", timeZone: TZ });
  const monthShort = start.toLocaleDateString("en-GB", { month: "short", timeZone: TZ });
  const subtitle = event.theme || event.tagline;
  const chips = eventChips(event);

  return (
    <div className="flex items-start gap-5">
      <div className="flex w-[66px] flex-shrink-0 flex-col items-center rounded-md border border-[#ECE7E9] bg-[#F8F6F7] py-2.5 leading-none">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">{weekday}</span>
        <span className="mt-1.5 text-[30px] font-extrabold tracking-tight text-[#111]">{dayNum}</span>
        <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">{monthShort}</span>
      </div>

      <div className="min-w-0 pt-0.5">
        <h3 className="text-xl font-extrabold uppercase leading-tight tracking-tight text-[#111] line-clamp-2 sm:text-[22px]">
          <Link href={href} className={`transition-colors hover:text-[#87102C] ${focusRing}`}>
            {event.title}
          </Link>
        </h3>
        {subtitle && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#87102C]">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-md border border-[#87102C]/20 bg-[#FFF5F7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#87102C]"
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
