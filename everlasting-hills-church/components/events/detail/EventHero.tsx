import Image from "next/image";
import { CalendarDays, CalendarPlus, MapPin, Radio } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDateRange, getEventStatus } from "./event-format";
import EventShareButton from "./EventShareButton";

export default function EventHero({ event }: { event: EventDetail }) {
  const poster = event.coverImageUrl || event.flyerImageUrl;
  const primaryUrl = event.primaryCtaUrl || event.liveUrl || (event.registrationRequired ? event.registrationUrl : null);
  const primaryLabel = event.primaryCtaLabel || (event.liveUrl ? "Join Live" : event.registrationRequired ? "Register" : null);
  const status = getEventStatus(event.startAt, event.endAt, event.timezone);
  const venue = [event.venueName, event.venueAddress].filter(Boolean).join(" · ");
  const dateLabel = formatEventDateRange(event.startAt, event.endAt, event.timezone);

  return (
    <section className="relative overflow-hidden bg-[#10080b] text-white">
      {event.heroImageUrl && (
        <div className="absolute inset-0 opacity-35" aria-hidden="true">
          <Image src={event.heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(135,16,44,0.38),transparent_42%),linear-gradient(110deg,rgba(16,8,11,0.98),rgba(16,8,11,0.76))]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 pb-20 pt-32 xs:px-5 sm:px-8 lg:grid-cols-[1.08fr_0.72fr] lg:gap-16 lg:py-36">
        <div className="min-w-0">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7CDD3]">
            <span>Everlasting Hills Church</span><span aria-hidden="true">·</span><span>{status}</span>
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-8xl">{event.title}</h1>
          {(event.theme || event.tagline) && <p className="mt-5 max-w-2xl text-xl font-medium leading-snug text-[#FFE8ED] sm:text-2xl">{event.theme || event.tagline}</p>}
          {event.shortDescription && <p className="mt-6 max-w-2xl break-words text-base leading-7 text-white/66 sm:text-lg">{event.shortDescription}</p>}

          <dl className="mt-8 flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:gap-5">
            <div className="flex items-center gap-2"><CalendarDays size={16} className="text-[#E7CDD3]" /><dt className="sr-only">Dates</dt><dd>{dateLabel}</dd></div>
            {event.Schedules.length > 0 && <div className="flex items-center gap-2"><Radio size={16} className="text-[#E7CDD3]" /><dt className="sr-only">Meeting times</dt><dd>{event.Schedules.map((item) => formatClock(item.startTime)).join(" & ")} · {timeZoneLabel(event.timezone)}</dd></div>}
            {venue && <div className="flex items-center gap-2"><MapPin size={16} className="text-[#E7CDD3]" /><dt className="sr-only">Location</dt><dd>{venue}</dd></div>}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            {primaryUrl && primaryLabel && <a href={primaryUrl} target={primaryUrl.startsWith("http") ? "_blank" : undefined} rel={primaryUrl.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.08em] text-[#6E0C24] transition hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">{primaryLabel}</a>}
            {event.registrationRequired && event.rsvpEnabled && !primaryUrl && <a href="#rsvp" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.08em] text-[#6E0C24]">Register</a>}
            <EventShareButton event={event} />
            {event.secondaryCtaUrl && event.secondaryCtaLabel && <a href={event.secondaryCtaUrl} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-bold text-white hover:bg-white/10">{event.secondaryCtaLabel}</a>}
            <a href={`${(process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")}/calendar/event/${encodeURIComponent(event.slug)}.ics`} download className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/80 hover:bg-white/10"><CalendarPlus size={15} /> Add to calendar</a>
          </div>
        </div>

        {poster && (
          <div className="relative mx-auto aspect-[4/5] w-full min-w-0 max-w-[430px] overflow-hidden rounded-sm bg-black/30 shadow-[0_30px_100px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
            <Image src={poster} alt={`${event.title}${event.theme ? ` — ${event.theme}` : ""} poster`} fill priority sizes="(max-width: 1024px) 90vw, 430px" className="object-contain" />
          </div>
        )}
      </div>
    </section>
  );
}

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function timeZoneLabel(timezone: string) {
  return timezone === "Africa/Lagos" ? "WAT" : timezone;
}
