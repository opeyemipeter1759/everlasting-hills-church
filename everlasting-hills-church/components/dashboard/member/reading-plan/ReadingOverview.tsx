"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Flame, Layers, Loader2, Pause, Play, Plus, Trophy } from "lucide-react";
import {
  readingHref,
  useReadingSubscriptions,
  useSetPlanStatus,
  type ReadingSubscription,
} from "@/lib/api/reading-plan";
import WordTabs from "./WordTabs";
import ReadingActivitySection from "./ReadingActivity";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#FFB3C1] dark:focus-visible:ring-offset-gray-950";
const primaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] ${focusRing}`;
const secondaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E7CDD3] px-3 py-2 text-sm font-semibold text-[#87102C] hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/15 dark:text-[#FFB3C1] dark:hover:bg-white/5 ${focusRing}`;

function ReadingDate({ value, timezone = "UTC" }: { value: string; timezone?: string }) {
  // Date-only values already belong to the member's timezone; timestamps need conversion.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return <time dateTime={value}>{new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: dateOnly ? "UTC" : timezone,
  }).format(new Date(dateOnly ? `${value}T12:00:00Z` : value))}</time>;
}

function PlanProgressCard({ subscription }: { subscription: ReadingSubscription }) {
  const titleId = useId();
  const setStatus = useSetPlanStatus();
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const { plan, status, completedDays, currentStreak, longestStreak, lastReadOn } = subscription;
  const percentage = plan.durationDays > 0
    ? Math.min(100, Math.max(0, Math.round(completedDays / plan.durationDays * 100)))
    : 0;
  const complete = status === "COMPLETED";
  const paused = status === "PAUSED";

  async function changeStatus() {
    setNotice(null);
    try {
      await setStatus.mutateAsync({ subscriptionId: subscription.subscriptionId, status: paused ? "ACTIVE" : "PAUSED" });
      setNotice({ message: paused ? "Plan resumed. Your other plans stay active." : "Plan paused. Your progress is saved.", error: false });
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : "Could not update this plan. Please try again.", error: true });
    }
  }

  return (
    <article aria-labelledby={titleId} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E7CDD3]/70 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="relative flex min-h-40 items-end overflow-hidden bg-[#4A0817] p-4 sm:p-5">
        {plan.coverImageUrl ? (
          <Image src={plan.coverImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" unoptimized />
        ) : (
          <BookOpen aria-hidden="true" size={132} strokeWidth={0.8} className="absolute -right-4 -top-3 -rotate-12 text-[#E7CDD3]/15" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D0610]/95 via-[#4A0817]/35 to-transparent" />
        <div className="relative min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? "bg-emerald-100 text-emerald-900" : paused ? "bg-amber-100 text-amber-900" : "bg-white/20 text-white"}`}>
              {complete ? <Check aria-hidden="true" size={12} /> : paused ? <Pause aria-hidden="true" size={12} /> : <BookOpen aria-hidden="true" size={12} />}
              {complete ? "Completed" : paused ? "Paused" : "Active"}
            </span>
            {!complete && subscription.completedToday && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-100"><Check aria-hidden="true" size={12} /> Read today</span>}
          </div>
          <h3 id={titleId} className="break-words font-serif text-xl font-bold leading-tight text-white">{plan.title}</h3>
          <p className="mt-1.5 text-xs text-white/75">{plan.durationDays} days · {subscription.translation.code}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/85">{completedDays} of {plan.durationDays} days read</p>
          <span className="text-sm font-bold text-[#87102C] dark:text-[#FFB3C1]">{percentage}%</span>
        </div>
        <div role="progressbar" aria-label={`${plan.title} progress`} aria-valuenow={completedDays} aria-valuemin={0} aria-valuemax={plan.durationDays} aria-valuetext={`${completedDays} of ${plan.durationDays} days read`} className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#F5E9E5] dark:bg-white/10">
          <div className={`h-full rounded-full transition-[width] ${complete ? "bg-emerald-600 dark:bg-emerald-400" : "bg-[#87102C] dark:bg-[#FFB3C1]"}`} style={{ width: `${percentage}%` }} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#FBF7F3] p-3 dark:bg-white/[0.04]">
          <div>
            <dt className="text-[11px] text-gray-500 dark:text-white/55">Current streak</dt>
            <dd className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-gray-800 dark:text-white/85"><Flame aria-hidden="true" size={14} className="text-[#87102C] dark:text-[#FFB3C1]" />{currentStreak} {currentStreak === 1 ? "day" : "days"}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-gray-500 dark:text-white/55">Best streak</dt>
            <dd className="mt-1 text-sm font-bold text-gray-800 dark:text-white/85">{longestStreak} {longestStreak === 1 ? "day" : "days"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-white/55">
          {lastReadOn ? <>Last read <ReadingDate value={lastReadOn} /></> : "Your first reading is waiting for you."}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/55">
          {complete && subscription.completedAt ? <>Completed <ReadingDate value={subscription.completedAt} timezone={subscription.timezone} /></> : <>Started <ReadingDate value={subscription.startedOn} /></>}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {paused ? (
            <button type="button" onClick={changeStatus} disabled={setStatus.isPending} className={`${primaryAction} disabled:opacity-50`} aria-label={`Resume ${plan.title}`}>
              {setStatus.isPending ? <Loader2 size={15} aria-hidden="true" className="animate-spin" /> : <Play size={15} aria-hidden="true" />}
              {setStatus.isPending ? "Resuming…" : "Resume plan"}
            </button>
          ) : (
            <Link href={readingHref(subscription.subscriptionId, complete ? 1 : undefined)} className={primaryAction}>
              {complete ? "Read again" : "Continue reading"}<ArrowRight aria-hidden="true" size={15} />
            </Link>
          )}
          <Link href={readingHref(subscription.subscriptionId, undefined, "schedule")} className={secondaryAction}>Whole plan</Link>
          {!complete && !paused && <button type="button" onClick={changeStatus} disabled={setStatus.isPending} aria-label={`Pause ${plan.title}`} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-gray-500 hover:text-[#87102C] disabled:opacity-50 dark:text-white/55 dark:hover:text-[#FFB3C1] ${focusRing}`}>
            {setStatus.isPending ? <Loader2 size={13} aria-hidden="true" className="animate-spin" /> : <Pause size={13} aria-hidden="true" />}Pause
          </button>}
        </div>
        {notice && <p role={notice.error ? "alert" : "status"} className={`mt-3 text-xs leading-relaxed ${notice.error ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300"}`}>{notice.message}</p>}
      </div>
    </article>
  );
}

export default function ReadingOverview() {
  const { data: subscriptions = [], isLoading, isError, refetch } = useReadingSubscriptions();
  const activePlans = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const pausedPlans = subscriptions.filter((subscription) => subscription.status === "PAUSED");
  const completedPlans = subscriptions.filter((subscription) => subscription.status === "COMPLETED");
  const bestStreak = subscriptions.reduce((best, subscription) => Math.max(best, subscription.longestStreak), 0);
  const readingsCompleted = subscriptions.reduce((total, subscription) => total + subscription.completedDays, 0);
  const summary = [
    { label: "Readings completed", value: readingsCompleted, detail: "Plan days across all your plans", icon: BookOpen },
    { label: "Active plans", value: activePlans.length, detail: "Read each at your own pace", icon: Layers },
    { label: "Completed plans", value: completedPlans.length, detail: "Every finished journey counts", icon: Trophy },
    { label: "Best streak in one plan", value: bestStreak, detail: `${bestStreak === 1 ? "Consecutive day" : "Consecutive days"} of reading`, icon: Flame },
  ];
  const groups = [
    { title: "Reading now", description: "Move between your plans whenever you like. Each keeps its own progress.", plans: activePlans },
    { title: "Paused plans", description: "Pick up where you left off. Resuming a plan keeps your other plans active.", plans: pausedPlans },
    { title: "Completed plans", description: "Celebrate the plans you have finished, or revisit a favourite reading.", plans: completedPlans },
  ];

  return (
    <div className="mx-auto min-w-0 max-w-4xl px-0 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-3 sm:py-6">
      <WordTabs />
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">Growing in the Word</p>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#111] dark:text-white sm:text-3xl">Your reading overview</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-white/55">See the effort you have put in and keep growing, one reading at a time.</p>
        </div>
        <Link href="/dashboard/reading/plans" className={secondaryAction}><Plus size={16} aria-hidden="true" />Add a plan</Link>
      </header>

      {isLoading ? (
        <div role="status" className="mt-6 space-y-5">
          <span className="sr-only">Loading your reading overview</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-[#FBF7F3] dark:bg-white/5" />)}</div>
          <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-[#FBF7F3] dark:bg-white/5" />)}</div>
        </div>
      ) : isError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          <p>We could not load your reading progress.</p>
          <button type="button" onClick={() => refetch()} className={`mt-3 ${secondaryAction}`}>Try again</button>
        </div>
      ) : subscriptions.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-[#E7CDD3]/70 bg-[#FBF7F3] px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"><BookOpen size={26} aria-hidden="true" /></span>
          <h2 className="mt-4 font-serif text-xl font-bold text-gray-900 dark:text-white">Your reading journey starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/55">Choose a Bible plan to begin. Your completed readings and progress will appear here, and you can follow several plans at once.</p>
          <Link href="/dashboard/reading/plans" className={`mt-5 ${primaryAction}`}>Choose a plan<ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      ) : (
        <>
          <section aria-label="Your reading effort" className="mt-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.map(({ label, value, detail, icon: Icon }) => <div key={label} className="min-w-0 rounded-2xl border border-[#E7CDD3]/60 bg-[#FBF7F3] p-3.5 dark:border-white/10 dark:bg-white/[0.03] sm:p-4">
                <Icon size={18} aria-hidden="true" className="mb-3 text-[#87102C] dark:text-[#FFB3C1]" />
                <dt className="text-xs font-semibold leading-relaxed text-gray-600 dark:text-white/65">{label}</dt>
                <dd className="mt-1 font-serif text-3xl font-bold text-[#4A0817] dark:text-white">{value.toLocaleString()}</dd>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-white/45">{detail}</p>
              </div>)}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-white/50">Each completed plan day counts as one reading. Reading in two plans on the same day counts as two readings.</p>
            <ReadingActivitySection />
          </section>

          {activePlans.length === 0 && <p className="mt-6 rounded-xl bg-[#FFF4F6] px-4 py-3 text-sm text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]">Ready for another reading? {pausedPlans.length > 0 ? "Resume a plan below or add a new one." : "Add a new plan to keep going."}</p>}
          {groups.filter((group) => group.plans.length > 0).map((group) => (
            <section key={group.title} aria-label={group.title} className="mt-7">
              <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">{group.title}<span className="ml-2 font-sans text-sm font-normal text-gray-500 dark:text-white/50">({group.plans.length})</span></h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/55">{group.description}</p>
              <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-2">
                {group.plans.map((subscription) => <PlanProgressCard key={subscription.subscriptionId} subscription={subscription} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
