"use client";

import Link from "next/link";
import { Clock3, Moon, Send } from "lucide-react";
import { useMyPrayerSignup } from "@/lib/api/prayer-watch";
import { card, cardTitle, hdrBdr, iconBg, iconCl, kicker, muted, linkCl } from "./tokens";

/** The member's own Prayer Watch hour, front and centre on their dashboard —
 *  not just on the dedicated page. Three states: none yet (invite), pending
 *  (awaiting approval), confirmed (the hour itself, plus a quick way in). */
export function PrayerWatchCard() {
  const { data, isLoading } = useMyPrayerSignup();
  if (isLoading) return null;

  const header = (
    <div className={`flex items-center gap-3 px-5 py-4 ${hdrBdr}`}>
      <span className={iconBg}>
        <Moon size={15} className={iconCl} aria-hidden="true" />
      </span>
      <div>
        <p className={kicker}>Prayer Watch</p>
        <h3 className={cardTitle}>Your watch hour</h3>
      </div>
    </div>
  );

  if (!data) {
    return (
      <section className={card} aria-label="Prayer Watch">
        {header}
        <div className="px-5 py-5">
          <p className={`text-sm ${muted}`}>
            You haven&apos;t picked a Prayer Watch yet — one two-hour hour, every night, with the same family.
          </p>
          <Link href="/dashboard/prayer-watch" className={`${linkCl} mt-3`}>
            Pick your hour →
          </Link>
        </div>
      </section>
    );
  }

  const { signup, slot } = data;

  if (signup.status === "PENDING") {
    return (
      <section className={card} aria-label="Prayer Watch">
        {header}
        <div className="px-5 py-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <Clock3 size={14} aria-hidden="true" /> Awaiting approval
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#111] dark:text-white">
            {slot.startTime}–{slot.endTime}
          </p>
          <p className={`text-sm ${muted}`}>{slot.label}</p>
          <Link href="/dashboard/prayer-watch" className={`${linkCl} mt-3`}>
            View your application →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={card} aria-label="Prayer Watch">
      {header}
      <div className="px-5 py-5">
        <p className="text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">You&apos;re on the watch</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[#111] dark:text-white">
          {slot.startTime}–{slot.endTime}
        </p>
        <p className={`text-sm ${muted}`}>{slot.label}</p>
        {data.telegramLink && (
          <a
            href={data.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#26A5E4] hover:underline"
          >
            <Send size={13} aria-hidden="true" /> Join the Telegram channel
          </a>
        )}
        <Link href="/dashboard/prayer-watch" className={`${linkCl} mt-3`}>
          Open Prayer Watch →
        </Link>
      </div>
    </section>
  );
}
