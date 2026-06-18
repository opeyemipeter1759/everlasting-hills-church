"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDate, formatEventTimeRange } from "./event-format";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Split-screen event hero (design system: SPLIT-SCREEN HERO on a dark ground).
 * The flyer sits framed on one side at its natural ratio so the whole artwork
 * shows without cropping; title, meta, and the RSVP CTA sit on the other.
 * Falls back to a branded gradient panel when no flyer exists.
 */
export default function EventHero({ event }: { event: EventDetail }) {
  const [flyerOk, setFlyerOk] = useState(Boolean(event.flyerImageUrl));

  const dateLabel = formatEventDate(event.startAt);
  const timeLabel = formatEventTimeRange(event.startAt, event.endAt);

  return (
    <section
      className="relative w-full overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 32%, #87102C 72%, #a01535 100%)",
      }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Glow accents */}
      <div className="absolute -top-24 right-[-6%] h-80 w-80 rounded-full bg-[#FFB3C1]/12 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] h-96 w-96 rounded-full bg-white/5 blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 py-28 sm:py-32 lg:grid-cols-2 lg:gap-16">
        {/* Flyer panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="order-2 mx-auto w-full max-w-sm lg:order-first"
        >
          <div className="rounded-3xl bg-gradient-to-br from-[#FFB3C1]/40 via-white/10 to-transparent p-1.5 shadow-2xl shadow-black/40">
            <div className="overflow-hidden rounded-[20px] bg-[#1a0610]">
              {flyerOk && event.flyerImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={event.flyerImageUrl}
                  alt={`${event.title} flyer`}
                  onError={() => setFlyerOk(false)}
                  className="block h-auto w-full"
                />
              ) : (
                <FlyerPlaceholder title={event.title} dateLabel={dateLabel} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="order-1 lg:order-last">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur-md"
          >
            <Sparkles size={12} className="text-[#FFB3C1]" />
            An Event · Everlasting Hills
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.22, ease: EASE }}
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-tight text-balance"
          >
            {event.title}
          </motion.h1>

          {event.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.34, ease: EASE }}
              className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-white/70"
            >
              {event.tagline}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.46, ease: EASE }}
            className="mt-7 flex flex-col gap-2.5 text-sm text-white/75"
          >
            {dateLabel && (
              <span className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <CalendarDays size={15} className="text-[#FFB3C1]" />
                </span>
                {dateLabel}
                {timeLabel ? ` · ${timeLabel}` : ""}
              </span>
            )}
            {(event.venueName || event.venueAddress) && (
              <span className="inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <MapPin size={15} className="text-[#FFB3C1]" />
                </span>
                {[event.venueName, event.venueAddress].filter(Boolean).join(" · ")}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            {event.rsvpEnabled && (
              <a
                href="#rsvp"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#87102C] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFE8ED] hover:shadow-2xl hover:shadow-black/40"
              >
                Reserve My Seat
                <ArrowDown size={14} />
              </a>
            )}
            <a
              href="#details"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/40 hover:bg-white/10"
            >
              View Event Details
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FlyerPlaceholder({ title, dateLabel }: { title: string; dateLabel: string }) {
  return (
    <div
      className="flex aspect-[3/4] w-full flex-col items-center justify-center px-8 text-center"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      <Sparkles size={34} className="mb-5 text-[#FFB3C1]/60" />
      <p className="font-serif text-2xl sm:text-3xl font-bold italic text-white">
        {title}
      </p>
      {dateLabel && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
          {dateLabel}
        </p>
      )}
    </div>
  );
}
