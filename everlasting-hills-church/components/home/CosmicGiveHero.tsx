"use client";

import { motion } from "framer-motion";
import { ArrowDown, Heart, Shield, Sparkles, Zap } from "lucide-react";

/**
 * Cosmic-themed hero for the /give page.
 *
 * Drop-in hero used above the existing accounts UI. Same dark + bento pattern as
 * the contact page hero so the two pages feel like siblings, but the visual focus
 * here is a pulsing donation orb (no globe — different page, different metaphor).
 *
 * The right-side bento highlights "why give" trust signals; the bottom CTA scrolls
 * to the existing #accounts section that holds the account-card UI.
 */
export default function CosmicGiveHero() {
  function scrollToAccounts() {
    const el = document.getElementById("accounts");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative overflow-hidden bg-church-dark text-white pt-24 pb-12">
      {/* Cosmic background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#87102C]/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/8 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 1px, transparent 0), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35) 1px, transparent 0), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.25) 1px, transparent 0)",
            backgroundSize: "300px 300px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── LEFT: headline + visual orb ── */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm mb-6"
            >
              <Sparkles size={12} className="text-[#e8768a]" />
              Partnership & Stewardship
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]"
            >
              Give &amp;{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#87102C] bg-clip-text text-transparent italic font-serif">
                Grow Hills.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-xl"
            >
              Your generosity fuels worship, outreach, pastoral care, and the next
              chapter of Everlasting Hills. Every gift — small or large — matters.
            </motion.p>

            {/* Pulsing orb visual */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:block mt-12 relative w-full max-w-md aspect-square"
            >
              {/* Outer ring (pulses slowly) */}
              <div className="absolute inset-0 rounded-full border border-[#87102C]/30 animate-pulse" />
              {/* Inner ring (pulses faster) */}
              <div className="absolute inset-8 rounded-full border border-[#e8768a]/20 animate-[pulse_3s_ease-in-out_infinite]" />
              {/* Core gradient orb */}
              <div className="absolute inset-20 rounded-full bg-gradient-to-br from-[#87102C] via-[#c93860] to-transparent blur-2xl opacity-60" />
              <div className="absolute inset-24 rounded-full bg-gradient-to-br from-[#e8768a] to-[#87102C] flex items-center justify-center shadow-2xl shadow-[#87102C]/50">
                <Heart size={48} className="text-white" />
              </div>
              {/* Tiny orbiting dots */}
              <div className="absolute top-4 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-[#e8768a]" />
              <div className="absolute right-4 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-amber-300" />
              <div className="absolute bottom-4 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-[#e8768a]" />
              <div className="absolute left-4 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-amber-300" />
            </motion.div>
          </div>

          {/* ── RIGHT: bento trust cards ── */}
          <div className="space-y-4">
            <TrustCard
              icon={<Zap size={18} />}
              eyebrow="Zero fees"
              primary="100% direct to ministry"
              secondary="Bank transfer with no payment gateway cut"
              delay={0.3}
            />
            <TrustCard
              icon={<Shield size={18} />}
              eyebrow="Audited annually"
              primary="Transparent stewardship"
              secondary="Published statements every fiscal year"
              delay={0.4}
            />
            <TrustCard
              icon={<Heart size={18} />}
              eyebrow="Where it goes"
              primary="Pastoral care, outreach, building"
              secondary="Your gift supports the local body and beyond"
              delay={0.5}
            />

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              type="button"
              onClick={scrollToAccounts}
              className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#87102C] to-[#a52242] hover:from-[#6E0C24] hover:to-[#87102C] px-6 py-4 font-bold text-sm transition-all shadow-lg shadow-[#87102C]/30 hover:shadow-xl hover:shadow-[#87102C]/40 hover:-translate-y-0.5"
            >
              View account details
              <ArrowDown
                size={16}
                className="group-hover:translate-y-0.5 transition-transform"
              />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustCard({
  icon,
  eyebrow,
  primary,
  secondary,
  delay = 0,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  primary: string;
  secondary: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 backdrop-blur-md p-5 transition-all"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#87102C]/20 text-[#e8768a] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">
          {eyebrow}
        </p>
        <p className="text-sm text-white font-bold mb-1">{primary}</p>
        <p className="text-xs text-white/60 leading-relaxed">{secondary}</p>
      </div>
    </motion.div>
  );
}
