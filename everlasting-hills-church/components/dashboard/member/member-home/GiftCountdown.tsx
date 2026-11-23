"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { kicker } from "./tokens";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Sunday, 6 December", in Lagos time, from the target the server sent. */
export function giftDayLabel(targetIso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).formatToParts(
    new Date(targetIso),
  );
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")}`;
}

/** Days, hours, minutes and seconds left; all zero once the moment has come. */
export function remaining(ms: number) {
  const left = Math.max(0, ms);
  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / SECOND),
  };
}

/**
 * A live countdown to the gift exchange & picnic. Ticks every second on the server's
 * clock: `clockOffsetMs` (server time minus this device's time, measured when
 * the API answered) corrects a phone set to the wrong time. Stops at zero.
 */
export function GiftCountdown({ targetDate, clockOffsetMs }: { targetDate: string; clockOffsetMs: number }) {
  const target = Date.parse(targetDate);
  const [now, setNow] = useState(() => Date.now() + clockOffsetMs);
  const done = now >= target;
  const still = useReducedMotion() ?? false;

  useEffect(() => {
    setNow(Date.now() + clockOffsetMs);
    if (Date.now() + clockOffsetMs >= target) return;
    const id = setInterval(() => {
      const t = Date.now() + clockOffsetMs;
      setNow(t);
      if (t >= target) clearInterval(id);
    }, SECOND);
    return () => clearInterval(id);
  }, [target, clockOffsetMs]);

  if (done) {
    return (
      <motion.p
        className="rounded-xl bg-gradient-to-r from-[#87102C] to-[#A3153A] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-[#87102C]/25"
        initial={still ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
      >
        It&apos;s today. See you there!
      </motion.p>
    );
  }

  const left = remaining(target - now);
  const units = [["days", left.days], ["hrs", left.hours], ["mins", left.minutes], ["secs", left.seconds]] as const;
  return (
    <div>
      <p className={`mb-2 ${kicker}`}>Starts in</p>
      <div
        className="grid grid-cols-4 gap-2"
        role="timer"
        aria-label={`${left.days} days, ${left.hours} hours, ${left.minutes} minutes left`}
      >
        {units.map(([label, value]) => (
          <div key={label} className="overflow-hidden rounded-xl bg-gradient-to-b from-[#A3153A] to-[#6E0C24] py-2.5 text-center text-white shadow-sm shadow-[#87102C]/25">
            {/* Each new number rolls up into place. */}
            <div className="relative h-5">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.p
                  key={value}
                  className="absolute inset-x-0 text-xl font-bold leading-5 tabular-nums"
                  initial={still ? false : { y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={still ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {String(value).padStart(2, "0")}
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#f5d49a]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
