"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDate, formatEventTimeRange } from "./event-format";

/**
 * Generic event hero — the flyer fills the background (cover-fit) with a burgundy
 * tint for legibility, falling back to the brand gradient if no flyer is present.
 * Mirrors the pattern used on the bespoke Heaven on Earth hero.
 */
export default function EventHero({ event }: { event: EventDetail }) {
  const [flyerVisible, setFlyerVisible] = useState(Boolean(event.flyerImageUrl));

  const dateLabel = formatEventDate(event.startAt);
  const timeLabel = formatEventTimeRange(event.startAt, event.endAt);

  return (
    <section
      className="relative min-h-[88vh] w-full flex items-center justify-center overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Flyer backdrop */}
      {flyerVisible && event.flyerImageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={event.flyerImageUrl}
          alt=""
          aria-hidden="true"
          onError={() => setFlyerVisible(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Tint for legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, rgba(42,4,16,0.84) 0%, rgba(74,8,25,0.74) 35%, rgba(135,16,44,0.62) 70%, rgba(160,21,53,0.64) 100%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-28 text-center">
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-2 text-xs tracking-[0.28em] uppercase font-semibold text-white/75 mb-7"
        >
          An Event · Everlasting Hills
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.98] tracking-tight text-balance"
        >
          {event.title}
        </motion.h1>

        {event.tagline && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-white/70 text-balance"
          >
            {event.tagline}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60 font-medium"
        >
          {dateLabel && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={15} className="text-[#FFB3C1]" />
              {dateLabel}
              {timeLabel ? ` · ${timeLabel}` : ""}
            </span>
          )}
          {event.venueName && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={15} className="text-[#FFB3C1]" />
              {event.venueName}
            </span>
          )}
        </motion.div>

        {event.rsvpEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.64 }}
            className="mt-10"
          >
            <a
              href="#rsvp"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#87102C] text-sm font-bold hover:bg-[#FFE8ED] hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Reserve My Seat
              <ArrowDown size={14} />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
