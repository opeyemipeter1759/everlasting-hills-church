import Image from "next/image";
import { CalendarDays, CalendarPlus, MapPin, Radio } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDateRange, getEventStatus } from "./event-format";
import EventShareButton from "./EventShareButton";

/**
 * Event hero — the dark half of the page's tonal inversion.
 *
 * Built to the editorial-dossier rules the rest of the event page follows:
 * depth comes from 1px hairlines and tonal shift, never shadows; one flat
 * scrim rather than stacked gradients; the headline carries the page at
 * display scale with tight tracking; and exactly one filled pill, so the
 * primary action is unmistakable among the outlined ones beside it.
 */
export default function EventHero({ event }: { event: EventDetail }) {
  const poster = event.coverImageUrl || event.flyerImageUrl;
  // Most events are given one image. Rather than leaving the banner bare when
  // no separate hero was uploaded, the poster stands in — heavily blurred and
  // darkened, so it reads as atmosphere behind the headline rather than as a
  // cropped poster with its text sliced off.
  const banner = event.heroImageUrl ?? poster;
  const bannerIsPoster = !event.heroImageUrl && Boolean(poster);
  const primaryUrl = event.primaryCtaUrl || event.liveUrl || (event.registrationRequired ? event.registrationUrl : null);
  const primaryLabel = event.primaryCtaLabel || (event.liveUrl ? "Join Live" : event.registrationRequired ? "Register" : null);
  const status = getEventStatus(event.startAt, event.endAt, event.timezone);
  const venue = [event.venueName, event.venueAddress].filter(Boolean).join(" · ");
  const dateLabel = formatEventDateRange(event.startAt, event.endAt, event.timezone);
  // An older API payload carries no schedules at all.
  const schedules = event.Schedules ?? [];
  const calendarHref = `${(process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")}/calendar/event/${encodeURIComponent(event.slug)}.ics`;

  return (
    <section className="relative overflow-hidden bg-[#10080b] text-white">
      {banner && (
        <div className="absolute inset-0 opacity-30" aria-hidden="true">
          <Image
            src={banner}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${bannerIsPoster ? "scale-110 blur-2xl" : ""}`}
          />
        </div>
      )}
      {/* One flat scrim. Stacked gradients read as glow; this system is printed. */}
      <div className="absolute inset-0 bg-[#10080b]/80" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-32 xs:px-5 sm:px-8 lg:grid-cols-[1.1fr_0.7fr] lg:gap-16 lg:pb-28 lg:pt-36">
        <div className="min-w-0">
          {/* Classification rail, in the uppercase tracked register used for
              every section label further down the page. */}
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center rounded-sm border border-white/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FFE8ED] xs:tracking-[0.22em]">
              {status}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 xs:tracking-[0.22em]">
              Everlasting Hills Church
            </span>
          </div>

          <h1 className="max-w-4xl text-balance text-[44px] font-black leading-[0.95] tracking-[-0.04em] xs:text-6xl sm:text-7xl lg:text-[86px]">
            {event.title}
          </h1>

          {(event.theme || event.tagline) && (
            <p className="mt-6 max-w-2xl text-balance text-xl font-medium leading-[1.25] tracking-[-0.02em] text-[#FFE8ED] sm:text-3xl">
              {event.theme || event.tagline}
            </p>
          )}

          {event.shortDescription && (
            <p className="mt-6 max-w-xl break-words text-base leading-[1.6] text-white/60 sm:text-[17px]">
              {event.shortDescription}
            </p>
          )}

          {/* Facts sit on a hairline rail rather than floating — borders do the
              separating work that shadows would elsewhere. */}
          <dl className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-8 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:gap-x-10">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} className="shrink-0 text-[#E7CDD3]" aria-hidden="true" />
              <dt className="sr-only">Dates</dt>
              <dd>{dateLabel}</dd>
            </div>
            {schedules.length > 0 && (
              <div className="flex items-center gap-2.5">
                <Radio size={15} className="shrink-0 text-[#E7CDD3]" aria-hidden="true" />
                <dt className="sr-only">Meeting times</dt>
                <dd>
                  {schedules.map((item) => formatClock(item.startTime)).join(" & ")} ·{" "}
                  {timeZoneLabel(event.timezone)}
                </dd>
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-2.5">
                <MapPin size={15} className="shrink-0 text-[#E7CDD3]" aria-hidden="true" />
                <dt className="sr-only">Location</dt>
                <dd>{venue}</dd>
              </div>
            )}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            {primaryUrl && primaryLabel && (
              <a
                href={primaryUrl}
                target={primaryUrl.startsWith("http") ? "_blank" : undefined}
                rel={primaryUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-bold uppercase tracking-[0.08em] text-[#10080b] transition-colors hover:bg-[#FFE8ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10080b]"
              >
                {primaryLabel}
              </a>
            )}
            {event.registrationRequired && event.rsvpEnabled && !primaryUrl && (
              <a
                href="#rsvp"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-bold uppercase tracking-[0.08em] text-[#10080b] transition-colors hover:bg-[#FFE8ED]"
              >
                Register
              </a>
            )}
            <EventShareButton event={event} />
            {event.secondaryCtaUrl && event.secondaryCtaLabel && (
              <a
                href={event.secondaryCtaUrl}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {event.secondaryCtaLabel}
              </a>
            )}
            <a
              href={calendarHref}
              download
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CalendarPlus size={15} aria-hidden="true" /> Add to calendar
            </a>
          </div>
        </div>

        {poster && (
          // The frame takes the artwork's own shape rather than imposing one.
          // A fixed portrait box left a landscape flyer floating in empty bands
          // above and below it; width/height 0 with h-auto lets the intrinsic
          // ratio decide, so wide art sits wide and tall art sits tall. The
          // blurred copy behind the headline is what fills the rest.
          <div className="mx-auto w-full min-w-0 max-w-[460px] overflow-hidden rounded-sm border border-white/15 bg-white/[0.03]">
            <Image
              src={poster}
              alt={`${event.title}${event.theme ? ` — ${event.theme}` : ""} poster`}
              width={0}
              height={0}
              priority
              sizes="(max-width: 1024px) 90vw, 460px"
              className="h-auto w-full"
            />
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
