import { CalendarDays, Clock, ExternalLink, MapPin, Mic, UserRound, type LucideIcon } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDateRange, formatEventTimeRange } from "./event-format";

/**
 * The facts, as a hairline-ruled table rather than a grid of floating cards.
 *
 * Borders and background tone do the separating, so nothing is elevated: the
 * cells share edges the way a printed schedule does, which keeps the eye on
 * the values instead of on five identical containers.
 */
export default function EventDetailsBento({ event }: { event: EventDetail }) {
  const chips: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: CalendarDays, label: "Date",           value: formatEventDateRange(event.startAt, event.endAt, event.timezone) || null },
    { icon: Clock,        label: "Time",           value: event.Schedules?.length ? event.Schedules.map((item) => `${formatClock(item.startTime)} ${item.title}`).join(" · ") : formatEventTimeRange(event.startAt, null, event.timezone) || null },
    { icon: MapPin,       label: "Venue",          value: [event.venueName, event.venueAddress].filter(Boolean).join(" · ") || null },
    { icon: UserRound,    label: "Host",           value: event.hostName },
    { icon: Mic,          label: "Guest Minister", value: event.guestMinister },
  ];

  const visible = chips.filter((c) => c.value);

  if (visible.length === 0 && !event.description && !event.mapsLink) return null;

  return (
    <section id="details" className="bg-[#FFF8F9] px-4 py-20 xs:px-5 sm:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#87102C] xs:tracking-[0.22em]">
            The Details
          </p>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.03em] text-[#111] sm:text-5xl">
            Everything you need to know
          </h2>
        </header>

        {visible.length > 0 && (
          // One shared 1px grid: the gap-px over a border-coloured background
          // draws every rule at hairline weight without stacking borders.
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[#E7CDD3] bg-[#E7CDD3] sm:grid-cols-2">
            {visible.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex items-start gap-4 bg-white px-5 py-6 sm:px-6">
                  <Icon size={16} className="mt-0.5 shrink-0 text-[#87102C]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a7e80] xs:tracking-[0.18em]">
                      {c.label}
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold leading-[1.5] text-[#111]">{c.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {event.description && (
          <p className="mx-auto mt-12 max-w-2xl whitespace-pre-line text-center text-[17px] leading-[1.7] text-[#555]">
            {event.description}
          </p>
        )}

        {event.mapsLink && (
          <div className="mt-10 text-center">
            <a
              href={event.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#181011] px-7 text-sm font-semibold text-[#181011] transition-colors hover:bg-[#FFF4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
            >
              <MapPin size={14} aria-hidden="true" />
              Get directions
              <ExternalLink size={12} className="opacity-50" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
