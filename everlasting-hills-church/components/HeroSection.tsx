"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(155deg, #87102C 0%, #6E0C24 40%, #4a0819 70%, #2a0410 100%)",
      }}
    >
      {/* ── Background texture layers ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Mountains illustration at bottom */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none">
        <MountainRange />
      </div>

      {/* Soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Scripture reference badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-sm mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFE8ED]" />
            <span className="text-white/70 text-xs tracking-[0.12em] uppercase font-medium">
              {/* ── Bible reference shown in the badge ── */}
              Rooted in Genesis 49:22–26
            </span>
          </motion.div>

          {/* Church name */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-white/60 text-sm sm:text-base tracking-[0.25em] uppercase font-medium mb-4"
          >
            Everlasting Hills Church
          </motion.p>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 text-balance"
          >
            {/* ── Main headline — edit freely ── */}
            Raising men who flourish{" "}
            <em className="not-italic text-[#FFB3C1]">beyond limits</em>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="text-white/65 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
          >
            {/* ── Subtext — edit freely ── */}
            A Word-centered, Spirit-filled, and community-focused church in
            Ibadan, Nigeria.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {/* ── Primary CTA ── */}
            <a
              href="#services"
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#87102C] text-sm font-semibold hover:bg-[#FFE8ED] transition-all duration-200 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Join Us This Sunday
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>

            {/* ── Secondary CTA ── */}
            <a
              href="#sermons"
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-white/40 group-hover:border-white/70 transition-colors">
                <Play size={10} fill="white" />
              </span>
              Watch Sermons
            </a>
          </motion.div>

          {/* Divider line + pillars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-16 flex items-center justify-center gap-0"
          >
            {["Word", "Spirit", "Community"].map((pillar, i) => (
              <span key={pillar} className="flex items-center">
                <span className="text-white/40 text-xs tracking-[0.2em] uppercase font-medium px-4">
                  {pillar}
                </span>
                {i < 2 && (
                  <span className="w-px h-3 bg-white/20 mx-0 flex-shrink-0" />
                )}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-white/30 text-[10px] tracking-widest uppercase">
          Scroll
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </motion.div>
    </section>
  );
}

// Layered mountain range SVG illustration
function MountainRange() {
  return (
    <svg
      viewBox="0 0 1440 220"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="w-full"
      aria-hidden="true"
    >
      {/* Back mountains */}
      <path
        d="M0,160 L180,60 L360,130 L540,40 L720,110 L900,50 L1080,120 L1260,55 L1440,140 L1440,220 L0,220 Z"
        fill="rgba(255,255,255,0.03)"
      />
      {/* Mid mountains */}
      <path
        d="M0,180 L200,90 L400,155 L600,70 L800,140 L1000,75 L1200,145 L1440,80 L1440,220 L0,220 Z"
        fill="rgba(255,255,255,0.04)"
      />
      {/* Front hills / ground transition */}
      <path
        d="M0,200 L240,140 L480,190 L720,130 L960,185 L1200,135 L1440,175 L1440,220 L0,220 Z"
        fill="rgba(255,232,237,0.06)"
      />
      {/* Ground — blends into next section */}
      <path
        d="M0,215 L1440,215 L1440,220 L0,220 Z"
        fill="rgba(255,255,255,0.05)"
      />
    </svg>
  );
}
