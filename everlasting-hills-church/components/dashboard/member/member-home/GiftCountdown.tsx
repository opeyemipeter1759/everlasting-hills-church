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
 * A live countdown to the gift exchange & picnic. Ticks every second on the server's
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
      <p className="rounded-xl border border-[#87102C]/20 bg-[#87102C]/[0.05] px-4 py-3 text-center text-sm font-semibold text-[#87102C] dark:border-[#FFB3C1]/30 dark:text-[#FFB3C1]">
        It&apos;s today. See you there!
      </p>
    );
  }

  const left = remaining(target - now);
  const units = [["days", left.days], ["hours", left.hours], ["minutes", left.minutes], ["seconds", left.seconds]] as const;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-white/50">Starts in</p>
      <div
        className="grid grid-cols-4 divide-x divide-gray-200 rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10"
        role="timer"
        aria-label={`${left.days} days, ${left.hours} hours, ${left.minutes} minutes left`}
      >
        {units.map(([label, value]) => (
          <div key={label} className="py-2.5 text-center">
            <p className="text-xl font-bold leading-none tabular-nums text-[#111] dark:text-white">{String(value).padStart(2, "0")}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-white/45">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
