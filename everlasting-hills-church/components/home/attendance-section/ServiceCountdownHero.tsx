"use client";

import { motion } from "framer-motion";
import { BellRing } from "lucide-react";
import { useCountdown } from "./useCountdown";

interface ServiceCountdownHeroProps {
  opensAt: string;
  onComplete: () => void;
  /** Tighter spacing/sizing for fixed-height dashboard cards — same content, smaller footprint. */
  compact?: boolean;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

const UNITS: { key: "hours" | "minutes" | "seconds"; label: string }[] = [
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

export default function ServiceCountdownHero({ opensAt, onComplete, compact = false }: ServiceCountdownHeroProps) {
  const countdown = useCountdown(opensAt, onComplete);
  // Fixed to the church's own timezone (WAT), not the renderer's — without an
  // explicit timeZone this depends on wherever the code happens to run, so
  // the server (building the initial HTML) and the visitor's browser
  // (hydrating moments later, in whatever timezone they're in) can compute
  // two different strings for the same instant. That mismatch is exactly
  // the kind of thing dev mode hides and a production build does not.
  const openTime = new Date(opensAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });

  return (
    <div className={`flex flex-col items-center text-center ${compact ? "gap-4" : "gap-8 py-6"}`}>
      <div className="relative">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-amber-400/40"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: i * 1.3 }}
          />
        ))}
        <motion.span
          className={`relative flex items-center justify-center rounded-full border border-amber-300/30 bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-transparent shadow-[0_18px_60px_rgba(245,158,11,0.25)] ${compact ? "h-12 w-12" : "h-20 w-20"}`}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BellRing size={compact ? 18 : 30} className="text-amber-300" strokeWidth={2} />
        </motion.span>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/80">
          Today&apos;s Service
        </p>
        <h3 className={`mt-2 font-bold tracking-tight text-white ${compact ? "text-lg" : "text-2xl sm:text-3xl"}`}>
          Check-in opens soon
        </h3>
        {!compact && (
          <p className="mt-1.5 text-sm text-white/55">
            Doors open at <span className="font-semibold text-white/80">{openTime}</span> — the button
            unlocks itself the moment it does.
          </p>
        )}
        {compact && (
          <p className="mt-1 text-xs text-white/50">
            Opens at <span className="font-semibold text-white/75">{openTime}</span>
          </p>
        )}
      </div>

      <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5 sm:gap-3"}`}>
        {UNITS.map((unit, i) => (
          <div key={unit.key} className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5 sm:gap-3"}`}>
            <div
              className={`flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm ${
                compact ? "w-12 py-1.5" : "w-[68px] py-3 sm:w-20"
              }`}
            >
              <span
                className={`font-mono font-bold tabular-nums text-white ${compact ? "text-lg" : "text-3xl sm:text-4xl"}`}
                aria-hidden="true"
              >
                {pad(countdown?.[unit.key] ?? 0)}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">
                {unit.label}
              </span>
            </div>
            {i < UNITS.length - 1 && (
              <span className={`font-bold text-white/25 ${compact ? "text-sm" : "text-xl"}`} aria-hidden="true">
                :
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {countdown
          ? `Check-in opens in ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds`
          : "Check-in is opening now"}
      </p>
    </div>
  );
}
