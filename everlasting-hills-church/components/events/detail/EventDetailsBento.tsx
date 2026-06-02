import {
  CalendarDays,
  Clock,
  MapPin,
  Mic,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDate, formatEventTimeRange } from "./event-format";

/**
 * Event details — anchor-info-chip grid (icon box + label + value) on a light
 * section, per the design system. Only chips with a value are rendered.
 */
export default function EventDetailsBento({ event }: { event: EventDetail }) {
  const chips: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: CalendarDays, label: "Date", value: formatEventDate(event.startAt) || null },
    { icon: Clock, label: "Time", value: formatEventTimeRange(event.startAt, event.endAt) || null },
    {
      icon: MapPin,
      label: "Venue",
      value: [event.venueName, event.venueAddress].filter(Boolean).join(" · ") || null,
    },
    { icon: UserRound, label: "Host", value: event.hostName },
    { icon: Mic, label: "Guest Minister", value: event.guestMinister },
  ];

  const visible = chips.filter((c) => c.value);

  return (
    <section id="details" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3 text-center">
          The Details
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance text-center">
          Everything you need to know
        </h2>

        {visible.length > 0 && (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-2xl bg-white border border-[#E7CDD3]/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(135,16,44,0.10)]"
                >
                  <span className="inline-flex w-11 h-11 rounded-xl bg-[#FFE8ED] items-center justify-center mb-4">
                    <Icon size={18} className="text-[#87102C]" />
                  </span>
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#888] mb-1">
                    {c.label}
                  </p>
                  <p className="text-[#111] font-semibold leading-snug">{c.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {event.description && (
          <div className="mt-12 max-w-3xl mx-auto">
            <p className="text-[#444] text-base sm:text-lg leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}

        {event.mapsLink && (
          <div className="mt-10 text-center">
            <a
              href={event.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-white transition-colors"
            >
              <MapPin size={15} />
              Get directions
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
