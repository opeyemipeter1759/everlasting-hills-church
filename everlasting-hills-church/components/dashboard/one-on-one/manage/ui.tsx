"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { card, cardTitle, hdrBdr, iconBg, iconCl, kicker, muted } from "@/components/dashboard/member/member-home/tokens";

export const input =
  "w-full rounded-xl border border-[#E7CDD3] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/10 dark:bg-white/[0.05] dark:text-white";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d0d24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7CDD3] px-3 py-2 text-sm font-semibold text-[#87102C] transition hover:bg-[#FFE8ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] disabled:opacity-50 dark:border-white/10 dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]";
export const label = "text-xs font-semibold text-[#5A4A4D] dark:text-white/60";
export { muted };

/** Monday-first, the way the church week is usually read. */
export const WEEKDAYS: { day: number; short: string; long: string }[] = [
  { day: 1, short: "Mon", long: "Monday" },
  { day: 2, short: "Tue", long: "Tuesday" },
  { day: 3, short: "Wed", long: "Wednesday" },
  { day: 4, short: "Thu", long: "Thursday" },
  { day: 5, short: "Fri", long: "Friday" },
  { day: 6, short: "Sat", long: "Saturday" },
  { day: 0, short: "Sun", long: "Sunday" },
];

export function Section({
  icon: Icon,
  eyebrow,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={card} aria-label={title}>
      <div className={`flex items-center justify-between gap-3 px-5 py-4 ${hdrBdr}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={iconBg}>
            <Icon size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className={kicker}>{eyebrow}</p>
            <h2 className={cardTitle}>{title}</h2>
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label: text,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={text}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87102C] disabled:opacity-50 ${
        checked ? "bg-[#87102C]" : "bg-[#E7CDD3] dark:bg-white/15"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

const LAGOS = "Africa/Lagos";

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Today's date in church local time, "YYYY-MM-DD". */
export function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS }).format(new Date());
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function durationLabel(minutes: number): string {
  if (minutes % 60 === 0) return minutes === 60 ? "1 hour" : `${minutes / 60} hours`;
  return `${minutes} min`;
}
