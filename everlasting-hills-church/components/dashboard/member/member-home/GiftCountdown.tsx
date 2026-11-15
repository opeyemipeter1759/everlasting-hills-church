"use client";

import { useEffect, useState } from "react";

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
 * A live countdown to the gift exchange. Ticks every second on the server's
 * clock: `clockOffsetMs` (server time minus this device's time, measured when
 * the API answered) corrects a phone set to the wrong time. Stops at zero.
 */
export function GiftCountdown({ targetDate, clockOffsetMs }: { targetDate: string; clockOffsetMs: number }) {
  const target = Date.parse(targetDate);
  const [now, setNow] = useState(() => Date.now() + clockOffsetMs);
  const done = now >= target;

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
      <p className="rounded-2xl bg-gradient-to-r from-[#F5C76B] to-[#FFE3A3] px-4 py-4 text-center text-lg font-black text-[#5A0A1E] shadow-lg shadow-black/20 motion-safe:animate-bounce [animation-iteration-count:3]">
        The day is here! 🎁
      </p>
    );
  }

  const left = remaining(target - now);
  const units = [["days", left.days], ["hours", left.hours], ["minutes", left.minutes], ["seconds", left.seconds]] as const;
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold text-[#F5C76B]">Gift exchange begins {giftDayLabel(targetDate)}</p>
      <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`${left.days} days, ${left.hours} hours, ${left.minutes} minutes left`}>
        {units.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/10 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-2xl font-black leading-none tabular-nums text-white">{String(value).padStart(2, "0")}</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5C76B]/90">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
