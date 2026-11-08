"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock3, Moon, Send, ShieldCheck } from "lucide-react";
import { useMyPrayerSignup, usePublicPrayerWatch, type PublicSlot } from "@/lib/api/prayer-watch";
import { card, cardTitle, hdrBdr, iconBg, iconCl, kicker, muted, linkCl } from "./tokens";
import { formatUntil, watchStatus } from "./watch-time";

const PRIMARY =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors";

/** The minute, refreshed each minute, so "Starts in" stays true while the page is open. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Header({ status }: { status?: "confirmed" | "pending" }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-4 ${hdrBdr}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={iconBg}>
          <Moon size={15} className={iconCl} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={kicker}>Prayer Watch</p>
          <h3 className={cardTitle}>Your watch hour</h3>
        </div>
      </div>
      {status === "confirmed" && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <ShieldCheck size={12} aria-hidden="true" /> Confirmed
        </span>
      )}
      {status === "pending" && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Clock3 size={12} aria-hidden="true" /> Awaiting approval
        </span>
      )}
    </div>
  );
}

/** The hour itself, when it next comes round, and which of the night's watches it is. */
function WatchHour({ slotId, startTime, endTime, label, live, watches }: {
  slotId: string; startTime: string; endTime: string; label: string; live: boolean | null; watches: PublicSlot[];
}) {
  const now = useNow();
  const status = watchStatus(startTime, endTime, now);
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tabular-nums tracking-tight text-[#111] dark:text-white">
            {startTime}<span className={`mx-1 font-medium ${muted}`}>–</span>{endTime}
          </p>
          <p className={`mt-1.5 truncate text-xs ${muted}`}>{label}</p>
        </div>
        {live !== null && (
          <span className={`shrink-0 text-xs font-semibold ${status.live ? "text-emerald-600 dark:text-emerald-400" : "text-[#87102C] dark:text-[#FFB3C1]"}`}>
            {status.live ? "● Praying now" : `Starts in ${formatUntil(status.minutesUntil)}`}
          </span>
        )}
      </div>
      {/* The night's watches, in order, with theirs lit. */}
      {watches.length > 1 && (
        <ol aria-label="The night's watches" className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${watches.length}, minmax(0, 1fr))` }}>
          {watches.map((watch) => {
            const mine = watch.id === slotId;
            return (
              <li key={watch.id} aria-current={mine ? "true" : undefined} title={`${watch.label} · ${watch.startTime}–${watch.endTime}`}>
                <span className={`block h-2 rounded-full ${mine ? (live ? "bg-[#87102C] dark:bg-[#FFB3C1]" : "bg-amber-400") : "bg-[#E7CDD3]/45 dark:bg-white/[0.07]"}`} />
                <span className={`mt-1 block text-[11px] tabular-nums ${mine ? "font-semibold text-[#111] dark:text-white" : muted}`}>{watch.startTime}</span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

/**
 * The member's own Prayer Watch hour on their dashboard: none yet (an
 * invitation), awaiting approval, or confirmed (the hour, when it next
 * starts, and the way into the watch's Telegram channel).
 */
export function PrayerWatchCard() {
  const { data, isLoading } = useMyPrayerSignup();
  const { data: current } = usePublicPrayerWatch();
  if (isLoading) return null;

  if (!data) {
    return (
      <section className={card} aria-label="Prayer Watch">
        <Header />
        <div className="space-y-4 px-5 py-4">
          <p className={`text-sm leading-relaxed ${muted}`}>
            Take a two-hour slot every night and pray with the same watch family.
          </p>
          <Link href="/dashboard/prayer-watch" className={`${PRIMARY} w-full bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
            Pick your hour <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  const { signup, slot } = data;
  const pending = signup.status === "PENDING";

  return (
    <section className={card} aria-label="Prayer Watch">
      <Header status={pending ? "pending" : "confirmed"} />
      <div className="px-5 py-4">
        <WatchHour slotId={slot.id} startTime={slot.startTime} endTime={slot.endTime} label={slot.label} live={pending ? null : true} watches={current?.slots ?? []} />
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {!pending && data.telegramLink && (
            <a href={data.telegramLink} target="_blank" rel="noopener noreferrer" className={`${PRIMARY} bg-[#26A5E4] text-white hover:bg-[#1f8fc6]`}>
              <Send size={14} aria-hidden="true" /> Join on Telegram
            </a>
          )}
          <Link href="/dashboard/prayer-watch" className={linkCl}>
            {pending ? "View your application" : "Open Prayer Watch"} <ChevronRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
