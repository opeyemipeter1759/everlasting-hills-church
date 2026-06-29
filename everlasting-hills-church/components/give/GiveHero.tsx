"use client";

import { motion } from "framer-motion";
import { HandHeart, ArrowRight, ChevronDown } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Give-page hero — full-bleed worship image with a brand dark overlay, a
 * two-tone headline, and design-system CTAs.
 *
 * Pattern: CENTERED HERO on a dark ground (UI-DESIGN-PROMPT). Accent words use
 * the warm-pink gradient reserved for dark headlines; CTAs follow the "on dark"
 * rules (solid white primary, ghost-outline secondary). Both CTAs reveal the
 * account options below, since bank transfer is how giving happens.
 */
export default function GiveHero() {
  function scrollToAccounts() {
    document
      .getElementById("ways-to-give")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-church-dark">
      {/* Full-bleed image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/church_congregation_2_1779193607195.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Brand dark overlay for legibility (no arbitrary colors) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-b from-church-dark/85 via-church-dark/70 to-church-dark/95"
      />
      {/* Soft burgundy glow + subtle grain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-1/3 h-[55%] w-[60%] -translate-x-1/2 rounded-full bg-[#87102C]/25 blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-32 text-center sm:px-8">
        {/* Eyebrow badge */}
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur-sm"
        >
          <HandHeart size={12} className="text-[#FFB3C1]" />
          Give
        </motion.span>

        {/* Two-tone headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="text-balance text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Your{" "}
          <em className="not-italic bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text text-transparent">
            Generosity
          </em>
          ,
          <br className="hidden sm:block" /> Our{" "}
          <em className="not-italic bg-gradient-to-r from-[#FFB3C1] via-[#c93860] to-[#87102C] bg-clip-text text-transparent">
            Mission
          </em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
        >
          Your gifts fuel worship, outreach, and pastoral care, carrying the
          gospel unto the utmost bound of the everlasting hills.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={scrollToAccounts}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-[#87102C] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:w-auto"
          >
            Give Now
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={scrollToAccounts}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
          >
            View Accounts
          </button>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.button
        type="button"
        onClick={scrollToAccounts}
        aria-label="Scroll to giving accounts"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/40 transition-colors hover:text-white"
      >
        <ChevronDown size={22} className="animate-bounce" />
      </motion.button>
    </section>
  );
}
