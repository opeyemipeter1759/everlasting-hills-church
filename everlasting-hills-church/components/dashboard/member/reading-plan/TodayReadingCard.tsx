"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Check, ChevronRight, Flame, Share2 } from "lucide-react";
import { readingHref, useReadingSubscriptions, useTodayReading } from "@/lib/api/reading-plan";
import { card, hdrBdr, iconBg, iconCl, kicker, cardTitle, muted, linkCl } from "../member-home/tokens";

/**
 * Today's reading, on the member dashboard.
 *
 * The whole feature is one loop: open the dashboard, see today's reading, read
 * it, mark it done, come back tomorrow. This card is the first step of that
 * loop, so it carries a reference and a promise of how long it takes, and
 * nothing else. Scripture text loads on the reading screen; the dashboard only
 * requests plan references and the member's lightweight progress summaries.
 */
export default function TodayReadingCard() {
  const { data, isLoading, isError, refetch } = useTodayReading();
  const { data: subscriptions, isLoading: plansLoading, isError: plansError, refetch: retryPlans } = useReadingSubscriptions();
  const [sharing, setSharing] = useState(false);

  if (isLoading || plansLoading) {
    return (
      <section className={`${card} p-5`}>
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
        <div className="mt-4 h-9 w-36 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      </section>
    );
  }

  if (isError || plansError) {
    return <section className={`${card} p-5`}><h3 className={cardTitle}>Your Bible plans</h3><p role="alert" className={`mt-3 text-sm ${muted}`}>
      Could not load your reading progress.{" "}
      <button type="button" onClick={() => { refetch(); retryPlans(); }} className={`${linkCl} min-h-11`}>Try again</button>
    </p></section>;
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
            <p className={kicker}>Bible plans</p>
            <h3 className={cardTitle}>{subscriptions?.length ? "Your reading journey" : "Start a reading plan"}</h3>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className={`text-sm ${muted}`}>
            {subscriptions?.length
              ? "Your progress is saved. Revisit a finished plan, resume a paused one, or start something new."
              : "Find a rhythm that fits your life. Read one plan or several together, with your progress saved for each."}
          </p>
          <Link
            href={subscriptions?.length ? "/dashboard/reading/overview" : "/dashboard/reading/plans"}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            {subscriptions?.length ? "View your progress" : "Choose a plan"} <ChevronRight size={15} />
          </Link>
        </div>
      </section>
    );
  }

  const { day, subscriptionId, currentDayIndex, plan, currentStreak, completedToday, completedDays } = data;
  const otherPlans = (subscriptions ?? []).filter((subscription) => subscription.status === "ACTIVE" && subscription.subscriptionId !== subscriptionId);

  return (
    <section className={`${card} flex flex-col overflow-hidden`}>
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
            href={readingHref(subscriptionId)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            {completedToday ? "Keep reading" : "Read now"} <ChevronRight size={15} />
          </Link>

          {day && (
            <button
              type="button"
              onClick={() => setSharing(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#87102C]/30 hover:text-[#87102C] dark:border-white/15 dark:text-gray-200 dark:hover:text-[#FFB3C1]"
            >
              <Share2 size={14} aria-hidden="true" />
              Share
            </button>
          )}

          {completedToday && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check size={13} /> Read today
            </span>
          )}

          <Link href="/dashboard/reading/plans" className={`${linkCl} ml-auto`}>
            Add a plan
          </Link>
        </div>
      </div>
      <div className={`mt-auto px-5 py-4 border-t border-gray-100 dark:border-white/10`}>
        {otherPlans.length > 0 && <div className="mb-3 space-y-2">
          <p className={`${kicker} mb-2`}>Also reading</p>
          {otherPlans.slice(0, 2).map((subscription) => (
            <Link key={subscription.subscriptionId} href={readingHref(subscription.subscriptionId)} className="flex min-h-11 items-center gap-3 rounded-xl bg-[#FFF4F6]/60 px-3 py-2.5 transition-colors hover:bg-[#FFE8ED] dark:bg-white/[0.03] dark:hover:bg-white/[0.07]">
              <BookOpen size={15} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#111] dark:text-white">{subscription.plan.title}</p><p className={`mt-0.5 text-xs ${muted}`}>{subscription.completedDays} of {subscription.plan.durationDays} days read</p></div>
              <ChevronRight size={15} aria-hidden="true" className="shrink-0 text-gray-400" />
            </Link>
          ))}
        </div>}
        <Link href="/dashboard/reading/overview" className={`${linkCl} inline-flex min-h-11 items-center gap-1.5`}>
          View all plans and progress <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>

{/*       <ShareSheet open={sharing} onClose={() => setSharing(false)} initialContent="reading" />
 */}    </section>
  );
}
