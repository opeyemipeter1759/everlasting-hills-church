"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Check, ChevronRight, Flame } from "lucide-react";
import { useTodayReading } from "@/lib/api/reading-plan";
import { card, hdrBdr, iconBg, iconCl, kicker, cardTitle, muted, linkCl } from "../member-home/tokens";

/**
 * Today's reading, on the member dashboard.
 *
 * The whole feature is one loop: open the dashboard, see today's reading, read
 * it, mark it done, come back tomorrow. This card is the first step of that
 * loop, so it carries a reference and a promise of how long it takes, and
 * nothing else. Scripture text loads on the reading screen, which is why the
 * dashboard query stays one small request.
 */
export default function TodayReadingCard() {
  const { data, isLoading } = useTodayReading();

  if (isLoading) {
    return (
      <section className={`${card} p-5`}>
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
        <div className="mt-4 h-9 w-36 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      </section>
    );
  }

  // No plan yet. An invitation, not an empty state: this is the moment the
  // whole feature is won or lost.
  if (!data) {
    return (
      <section className={`${card} overflow-hidden`}>
        <div className={`flex items-center gap-3 px-5 py-4 ${hdrBdr}`}>
          <span className={iconBg}>
            <BookOpen size={15} className={iconCl} aria-hidden="true" />
          </span>
          <div>
            <p className={kicker}>Daily scripture</p>
            <h3 className={cardTitle}>Start a reading plan</h3>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className={`text-sm ${muted}`}>
            A passage a day, matched to where you are. Nothing to fall behind on: your plan moves
            when you read, not when the calendar does.
          </p>
          <Link
            href="/dashboard/reading/plans"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            Choose a plan <ChevronRight size={15} />
          </Link>
        </div>
      </section>
    );
  }

  const { day, currentDayIndex, plan, currentStreak, completedToday, completedDays } = data;

  return (
    <section className={`${card} overflow-hidden`}>
      {/* The plan's own art, sized down to a strip. It is the one card on the
          dashboard a member is meant to open every day, and the cover is what
          makes it recognisable at a glance among a column of bordered boxes. */}
      {plan.coverImageUrl ? (
        <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-[#4A0817] px-5 py-4">
          <Image
            src={plan.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 520px"
            className="object-cover opacity-90"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#4A0817]/85 via-[#4A0817]/45 to-transparent" />

          <div className="relative min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Today&apos;s reading
            </p>
            <h3 className="mt-0.5 truncate font-serif text-lg font-bold text-white">{plan.title}</h3>
          </div>

          {currentStreak > 0 && (
            <span className="relative inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-amber-200 backdrop-blur-sm">
              <Flame size={12} aria-hidden="true" />
              {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </span>
          )}
        </div>
      ) : (
        <div className={`flex items-center justify-between gap-3 px-5 py-4 ${hdrBdr}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconBg}>
              <BookOpen size={15} className={iconCl} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={kicker}>Today&apos;s reading</p>
              <h3 className={`${cardTitle} truncate`}>{plan.title}</h3>
            </div>
          </div>

          {currentStreak > 0 && (
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Flame size={12} aria-hidden="true" />
              {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      <div className="px-5 py-5">
        <p className="text-lg font-bold text-[#111] dark:text-white">
          {day?.referenceLabel ?? "Plan complete"}
        </p>
        <p className={`mt-1 text-xs ${muted}`}>
          Day {currentDayIndex} of {plan.durationDays}
          {day ? ` · about ${day.estimatedMinutes} minute${day.estimatedMinutes === 1 ? "" : "s"}` : ""}
          {/* Progress, never debt. The day index moves when they read, so there
              is nothing to be behind on and nothing to apologise for. */}
          {completedDays > 0 ? ` · ${completedDays} read` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/reading"
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            {completedToday ? "Read again" : "Read now"} <ChevronRight size={15} />
          </Link>

          {completedToday && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check size={13} /> Read today
            </span>
          )}

          <Link href="/dashboard/reading/plans" className={`${linkCl} ml-auto`}>
            Change plan
          </Link>
        </div>
      </div>
    </section>
  );
}
