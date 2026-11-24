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
    <div className="flex items-start gap-3.5">
      <div className="flex w-[50px] flex-shrink-0 flex-col items-center rounded-md border border-[#ECE7E9] bg-[#F8F6F7] py-1.5 leading-none">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">{weekday}</span>
        <span className="mt-1 text-xl font-bold tracking-tight text-[#111]">{dayNum}</span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">{monthShort}</span>
      </div>

      <div className="min-w-0 pt-0.5">
        <h3 className="text-base font-bold leading-snug tracking-tight text-[#111] line-clamp-2">
          <Link href={href} className={`transition-colors hover:text-[#87102C] ${focusRing}`}>
            {event.title}
          </Link>
        </h3>
        {subtitle && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#87102C] line-clamp-1">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded border border-[#87102C]/15 bg-[#FFF5F7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#87102C]"
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
