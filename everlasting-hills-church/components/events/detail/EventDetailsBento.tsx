import { CalendarDays, Clock, ExternalLink, MapPin, Mic, UserRound, type LucideIcon } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDate, formatEventTimeRange } from "./event-format";

export default function EventDetailsBento({ event }: { event: EventDetail }) {
  const chips: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: CalendarDays, label: "Date",           value: formatEventDate(event.startAt) || null },
    { icon: Clock,        label: "Time",           value: formatEventTimeRange(event.startAt, event.endAt) || null },
    { icon: MapPin,       label: "Venue",          value: [event.venueName, event.venueAddress].filter(Boolean).join(" · ") || null },
    { icon: UserRound,    label: "Host",           value: event.hostName },
    { icon: Mic,          label: "Guest Minister", value: event.guestMinister },
  ];

  const visible = chips.filter((c) => c.value);

  if (visible.length === 0 && !event.description && !event.mapsLink) return null;

  return (
    <section id="details" className="py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">

        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#87102C] text-center mb-2">
          The Details
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111] text-center tracking-tight mb-12">
          Everything you need to know
        </h2>

        {/* Info chips */}
        {visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {visible.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="flex items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/60 px-5 py-4"
                >
                  <span className="flex-shrink-0 flex w-10 h-10 rounded-xl bg-[#FFE8ED] items-center justify-center mt-0.5">
                    <Icon size={16} className="text-[#87102C]" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#aaa] mb-0.5">
                      {c.label}
                    </p>
                    <p className="text-[#111] font-semibold text-sm leading-snug">{c.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-[#555] text-base leading-relaxed whitespace-pre-line text-center max-w-2xl mx-auto mb-10">
            {event.description}
          </p>
        )}

        {/* Directions */}
        {event.mapsLink && (
          <div className="text-center">
            <a
              href={event.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-[#FFF4F6] transition-colors"
            >
              <MapPin size={14} />
              Get directions
              <ExternalLink size={12} className="opacity-50" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
