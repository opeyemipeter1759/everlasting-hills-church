"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, PartyPopper } from "lucide-react";

const FLAGS = ["#f5d49a", "#FFB3C1", "#ffffff", "#E8A33D"];
const FLAG_COUNT = 14;

/** Fixed (non-random) pieces, so server and client render the same thing. Kept to the right, clear of the text. */
const CONFETTI = [
  { right: "6%", w: 4, h: 9, color: "#f5d49a", delay: 0, duration: 3.4, drift: -10 },
  { right: "14%", w: 5, h: 5, color: "#ffffff", delay: 1.2, duration: 3.0, drift: 8 },
  { right: "22%", w: 3, h: 8, color: "#FFB3C1", delay: 0.6, duration: 3.8, drift: -6 },
  { right: "30%", w: 4, h: 4, color: "#f5d49a", delay: 2.0, duration: 3.2, drift: 10 },
  { right: "38%", w: 3, h: 7, color: "#FFB3C1", delay: 1.6, duration: 3.6, drift: -8 },
  { right: "10%", w: 3, h: 7, color: "#E8A33D", delay: 2.6, duration: 3.1, drift: 6 },
  { right: "26%", w: 4, h: 9, color: "#ffffff", delay: 3.0, duration: 3.5, drift: -12 },
];

/** Where the streamers rest when motion is reduced. */
const STILL = ["30%", "70%", "48%", "78%", "36%", "62%", "20%"];

/** A string of party flags across the top; each flag sways gently on the string. */
function Bunting({ still }: { still: boolean }) {
  return (
    <svg aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-6 w-full overflow-visible" viewBox="0 0 280 24" preserveAspectRatio="none">
      <path d="M0 3 Q140 12 280 3" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      {Array.from({ length: FLAG_COUNT }, (_, i) => {
        const x = 6 + i * (268 / (FLAG_COUNT - 1));
        const t = x / 280;
        const y = 3 + 18 * t * (1 - t); // on the string's curve (the Q path above)
        return (
          <motion.path
            key={i}
            d={`M${x - 6} ${y} L${x + 6} ${y} L${x} ${y + 12} Z`}
            fill={FLAGS[i % FLAGS.length]}
            opacity={0.9}
            style={{ transformBox: "fill-box", originX: 0.5, originY: 0 }}
            initial={still ? false : { scaleY: 0 }}
            animate={still ? undefined : { scaleY: 1, rotate: [0, i % 2 ? 7 : -7, 0] }}
            transition={{
              scaleY: { delay: 0.05 * i, type: "spring", stiffness: 300, damping: 12 },
              rotate: { duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 + 0.1 * i },
            }}
          />
        );
      })}
    </svg>
  );
}

function Sparkle({ className, size, delay, still }: { className: string; size: number; delay: number; still: boolean }) {
  return (
    <motion.svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      animate={still ? undefined : { scale: [0.6, 1.15, 0.6], opacity: [0.4, 1, 0.4], rotate: [0, 45, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
    </motion.svg>
  );
}

interface HeaderProps {
  titleId: string;
  kicker: string;
  title: string;
  dayLabel: string | null;
  /** h3 inside the card, h2 as a dialog's title. */
  level?: "h2" | "h3";
  /** Room on the right for a close button. */
  className?: string;
}

/** The party banner at the top of the gift exchange card and its register modal. */
export function GiftPartyHeader({ titleId, kicker, title, dayLabel, level = "h3", className = "" }: HeaderProps) {
  const still = useReducedMotion() ?? false;
  const Heading = level;

  return (
    <div className={`relative isolate overflow-hidden bg-[linear-gradient(135deg,#A3153A_0%,#87102C_45%,#5c0a1e_100%)] px-5 pb-5 pt-8 text-white ${className}`}>
      <Bunting still={still} />

      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute -z-10 rounded-[1px]"
          style={{ right: c.right, top: still ? STILL[i] : 0, width: c.w, height: c.h, background: c.color }}
          initial={still ? false : { y: -12, opacity: 0 }}
          animate={still ? { rotate: 25 * (i % 2 ? 1 : -1) } : { y: 150, x: c.drift, rotate: 360, opacity: [0, 1, 1, 0] }}
          transition={still ? { duration: 0 } : { duration: c.duration, delay: c.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}

      <Sparkle className="absolute right-[18%] top-[58%] -z-10 text-[#f5d49a]" size={12} delay={0} still={still} />
      <Sparkle className="absolute right-[6%] top-[38%] -z-10 text-white/80" size={8} delay={0.9} still={still} />
      <Sparkle className="absolute right-[34%] top-[34%] -z-10 text-[#FFB3C1]" size={7} delay={1.6} still={still} />

      <div className="flex items-center gap-3">
        <motion.span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5d49a] text-[#6E0C24] shadow-md shadow-black/20"
          initial={still ? false : { scale: 0, rotate: -30 }}
          animate={still ? undefined : { scale: 1, rotate: [0, 0, -14, 10, -6, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 260, damping: 12, delay: 0.2 },
            rotate: { duration: 0.9, repeat: Infinity, repeatDelay: 3.5, delay: 1 },
          }}
        >
          <PartyPopper size={18} aria-hidden="true" />
        </motion.span>
        <motion.div
          className="min-w-0"
          initial={still ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5d49a]">{kicker}</p>
          <Heading id={titleId} className="text-base font-bold leading-snug">
            {title}
          </Heading>
        </motion.div>
      </div>

      {dayLabel && (
        <motion.p
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold ring-1 ring-white/15"
          initial={still ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <CalendarDays size={13} className="text-[#f5d49a]" aria-hidden="true" />
          {dayLabel}
        </motion.p>
      )}
    </div>
  );
}
