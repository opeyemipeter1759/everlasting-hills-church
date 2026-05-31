"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Live countdown to the event. Glassmorphic cards on a light section with subtle
 * burgundy gradient. Hydration-safe: first paint shows zeros (server-rendered),
 * then real numbers hydrate in useEffect.
 *
 * Digit transitions use AnimatePresence with key=value so each tick swaps cleanly.
 *
 * When the event passes, the section renders a "We met. Thank God." closing state
 * instead of negative time.
 */

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function computeTimeLeft(target: Date): TimeLeft {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, passed: false };
}

export default function CountdownTimer() {
  // Server + first paint = all zeros (no hydration mismatch)
  const [t, setT] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    passed: false,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const target = new Date(HEAVEN_ON_EARTH.date);
    setT(computeTimeLeft(target));
    setHydrated(true);
    const id = setInterval(() => setT(computeTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Noise + glow */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB3C1]/12 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center text-white">
        <ScrollReveal>
          <p className="text-[#FFB3C1] text-xs tracking-[0.4em] uppercase font-bold mb-3">
            The wait
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-balance">
            {t.passed ? (
              <>
                Heaven{" "}
                <em className="not-italic text-[#FFB3C1] font-serif italic">
                  came down
                </em>
                .
              </>
            ) : (
              <>
                Until{" "}
                <em className="not-italic text-[#FFB3C1] font-serif italic">
                  heaven meets earth
                </em>
                .
              </>
            )}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-white/65 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {t.passed
              ? "Thank you for joining us. Watch this space for the next gathering."
              : `${HEAVEN_ON_EARTH.dateDisplay} · ${HEAVEN_ON_EARTH.timeDisplay}`}
          </p>
        </ScrollReveal>

        {!t.passed && (
          <ScrollReveal delay={0.3}>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <CountCard
                label="Days"
                value={t.days}
                hydrated={hydrated}
                pad={2}
              />
              <CountCard
                label="Hours"
                value={t.hours}
                hydrated={hydrated}
                pad={2}
              />
              <CountCard
                label="Minutes"
                value={t.minutes}
                hydrated={hydrated}
                pad={2}
              />
              <CountCard
                label="Seconds"
                value={t.seconds}
                hydrated={hydrated}
                pad={2}
              />
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

// ── Single glassmorphic count card with animated digit swap ────────────────

function CountCard({
  value,
  label,
  hydrated,
  pad,
}: {
  value: number;
  label: string;
  hydrated: boolean;
  pad: number;
}) {
  const display = value.toString().padStart(pad, "0");
  return (
    <div className="relative rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 p-5 sm:p-8 overflow-hidden">
      {/* Inner highlight at top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative h-16 sm:h-20 md:h-24 flex items-center justify-center">
        {hydrated ? (
          <AnimatePresence mode="popLayout">
            <motion.span
              key={display}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight tabular-nums text-white"
            >
              {display}
            </motion.span>
          </AnimatePresence>
        ) : (
          <span className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight tabular-nums text-white/40">
            {display}
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#FFB3C1] font-bold text-center">
        {label}
      </p>
    </div>
  );
}
