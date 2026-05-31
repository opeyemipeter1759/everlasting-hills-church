"use client";

import { motion } from "framer-motion";
import { ArrowDown, ChevronDown, Sparkles } from "lucide-react";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Hero section — full viewport, atmospheric dark gradient with light rays + floating
 * particles + mountain silhouettes. Centered Hero pattern from the design system.
 *
 * Animations: framer-motion entrance with staggered delays for the eyebrow, headline,
 * tagline, CTA pair, and scroll indicator. CSS-only float for the particles + light
 * rays (no JS overhead).
 */
export default function HeroExperience() {
  return (
    <section
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* ── Background layers ─────────────────────────────────────────────── */}

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Divine light rays (CSS-animated gradient sweeps) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 left-1/4 w-[600px] h-[1200px] bg-gradient-to-b from-[#FFB3C1]/15 via-transparent to-transparent rotate-12 blur-3xl animate-[heoLightRay_8s_ease-in-out_infinite]" />
        <div className="absolute -top-1/2 right-1/4 w-[500px] h-[1100px] bg-gradient-to-b from-white/8 via-transparent to-transparent -rotate-12 blur-3xl animate-[heoLightRay_10s_ease-in-out_infinite_1s]" />
      </div>

      {/* Floating particles — CSS only, no React state */}
      <Particles />

      {/* Mountain silhouettes at the bottom */}
      <MountainSilhouettes />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-32 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-2 text-xs tracking-[0.3em] uppercase font-semibold text-white/75 mb-8"
        >
          <Sparkles size={12} className="text-[#FFB3C1]" />
          A Gathering · Everlasting Hills
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight text-balance"
        >
          Heaven{" "}
          <em className="not-italic bg-gradient-to-r from-[#FFB3C1] via-[#FFE8ED] to-white bg-clip-text text-transparent font-serif italic">
            on Earth
          </em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-white/70 text-balance"
        >
          {HEAVEN_ON_EARTH.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap justify-center items-center gap-3"
        >
          <a
            href={HEAVEN_ON_EARTH.rsvpAnchor}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#87102C] text-sm font-bold hover:bg-[#FFE8ED] hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            Reserve My Seat
            <ArrowDown size={14} />
          </a>
          <a
            href="#details"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/40 transition-all duration-200"
          >
            View Event Details
          </a>
        </motion.div>

        {/* Event meta strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-14 inline-flex items-center gap-2 sm:gap-4 text-xs text-white/50 font-medium tracking-wide"
        >
          <span>{HEAVEN_ON_EARTH.dateDisplay}</span>
          <span aria-hidden="true" className="text-white/25">·</span>
          <span>{HEAVEN_ON_EARTH.timeDisplay}</span>
          <span aria-hidden="true" className="hidden sm:inline text-white/25">·</span>
          <span className="hidden sm:inline">{HEAVEN_ON_EARTH.venue.name}</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#invitation"
        aria-label="Scroll to invitation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">Scroll</span>
        <ChevronDown size={18} className="animate-bounce" />
      </motion.a>

      {/* Local keyframes — kept inline so the page is self-contained */}
      <style jsx>{`
        @keyframes heoLightRay {
          0%, 100% { transform: translateY(0) rotate(var(--rot, 12deg)); opacity: 0.6; }
          50% { transform: translateY(40px) rotate(var(--rot, 12deg)); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────────────

function Particles() {
  // 12 particles with varied sizes, positions, delays — all CSS-driven
  const particles = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((i) => {
        const size = 2 + ((i * 7) % 4);
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const delay = (i * 0.4) % 5;
        const duration = 6 + ((i * 1.3) % 6);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-[#FFB3C1]/60 blur-[1px]"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              animation: `heoFloat ${duration}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes heoFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(5px); opacity: 0.9; }
          50% { transform: translateY(-30px) translateX(-5px); opacity: 0.6; }
          75% { transform: translateY(-15px) translateX(3px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function MountainSilhouettes() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full h-48 sm:h-64 pointer-events-none"
      viewBox="0 0 1400 200"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Three layered peaks at increasing opacity for depth */}
      <path
        d="M0 200 L0 140 L180 80 L350 110 L520 60 L700 95 L880 55 L1050 90 L1220 70 L1400 110 L1400 200 Z"
        fill="black"
        opacity="0.15"
      />
      <path
        d="M0 200 L0 165 L220 120 L420 150 L620 110 L820 140 L1020 105 L1210 135 L1400 120 L1400 200 Z"
        fill="black"
        opacity="0.3"
      />
      <path
        d="M0 200 L0 185 L300 165 L600 175 L900 160 L1200 175 L1400 165 L1400 200 Z"
        fill="black"
        opacity="0.5"
      />
    </svg>
  );
}
