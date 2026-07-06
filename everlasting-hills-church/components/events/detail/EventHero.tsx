"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import type { EventDetail } from "@/types";
import { formatEventDate, formatEventTimeRange } from "./event-format";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function EventHero({ event }: { event: EventDetail }) {
  const [flyerOk, setFlyerOk] = useState(Boolean(event.flyerImageUrl));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dateLabel = formatEventDate(event.startAt);
  const timeLabel = formatEventTimeRange(event.startAt, event.endAt);
  const venue = [event.venueName, event.venueAddress].filter(Boolean).join(" · ");

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden bg-[#0E020A]">

      {/* ── Background ──────────────────────────────────────────────────── */}
      {flyerOk && event.flyerImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={event.flyerImageUrl}
          alt=""
          aria-hidden="true"
          onError={() => setFlyerOk(false)}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
        <FallbackCanvas />
      )}

      {/* Bottom-heavy gradient so text is always readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #0E020A 0%, rgba(14,2,10,0.88) 28%, rgba(14,2,10,0.5) 52%, rgba(14,2,10,0.15) 75%, transparent 100%)",
        }}
      />
      {/* Subtle side vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 100%, transparent 40%, rgba(14,2,10,0.45) 100%)",
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-10 pb-16 sm:pb-24 pt-48">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#FFB3C1]/70 mb-4"
        >
          Everlasting Hills Church &nbsp;·&nbsp; Event
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
          className="font-black text-white leading-[0.95] tracking-tight text-balance"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)" }}
        >
          {event.title}
        </motion.h1>

        {event.tagline && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
            className="mt-4 text-white/55 text-base sm:text-lg leading-relaxed max-w-xl"
          >
            {event.tagline}
          </motion.p>
        )}

        {/* Meta chips */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.34, ease: EASE }}
          className="mt-7 flex flex-wrap gap-2.5"
        >
          {dateLabel && (
            <MetaChip icon={CalendarDays}>
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ""}
            </MetaChip>
          )}
          {venue && (
            <MetaChip icon={MapPin}>{venue}</MetaChip>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.46, ease: EASE }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {event.rsvpEnabled && (
            <a
              href="#rsvp"
              className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#87102C] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFE8ED] hover:shadow-[0_12px_40px_rgba(135,16,44,0.35)]"
            >
              Reserve My Seat
              <ArrowDown size={13} className="group-hover:translate-y-0.5 transition-transform" />
            </a>
          )}
          <a
            href="#details"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md px-7 py-3.5 text-sm font-semibold text-white/85 transition-all duration-200 hover:border-white/35 hover:bg-white/10"
          >
            Event Details
          </a>
        </motion.div>
      </div>

      {/* ── Scroll cue ──────────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Scroll</span>
        <motion.span
          className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}

/* ── Meta chip ───────────────────────────────────────────────────────────── */
function MetaChip({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 backdrop-blur-md px-4 py-2.5 text-sm text-white/80">
      <Icon size={13} className="text-[#FFB3C1] flex-shrink-0" />
      <span>{children}</span>
    </span>
  );
}

/* ── Fallback canvas (no flyer image) ────────────────────────────────────── */
function FallbackCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, #1a0410 0%, #3a0818 35%, #87102C 75%, #a8163a 100%)",
        }}
      />
      {/* Large soft orb */}
      <div
        className="absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #FFB3C1 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Brand text watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <p
          className="font-black text-white/[0.04] text-center uppercase tracking-[0.2em] leading-none"
          style={{ fontSize: "clamp(4rem, 18vw, 14rem)" }}
          aria-hidden="true"
        >
          EHC
        </p>
      </div>
    </div>
  );
}
