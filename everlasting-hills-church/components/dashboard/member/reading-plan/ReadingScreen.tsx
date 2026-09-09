"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Flame, Loader2 } from "lucide-react";
import {
  useCompleteDay,
  usePassage,
  useTodayReading,
  useUncompleteDay,
  type DayPortion,
} from "@/lib/api/reading-plan";

/**
 * The reading screen: scripture, then one button.
 *
 * Text loads here rather than on the dashboard, which is what keeps the
 * dashboard query small. Each portion is its own request against an endpoint
 * cached for a year, so a passage read twice costs nothing the second time.
 */
export default function ReadingScreen() {
  const { data, isLoading } = useTodayReading();
  const complete = useCompleteDay();
  const uncomplete = useUncompleteDay();
  const [justRead, setJustRead] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (!data || !data.day) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 text-center">
        <BookOpen size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
          {data ? "You have finished this plan." : "You have not chosen a reading plan yet."}
        </p>
        <Link
          href="/dashboard/reading/plans"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
        >
          {data ? "Start another plan" : "Choose a plan"}
        </Link>
      </div>
    );
  }

  const { day, plan, subscriptionId, translation, currentDayIndex, currentStreak, completedToday } =
    data;
  const done = completedToday || justRead;

  async function markRead() {
    await complete.mutateAsync({ subscriptionId, dayIndex: currentDayIndex });
    setJustRead(true);
  }

  async function undo() {
    await uncomplete.mutateAsync({ subscriptionId, dayIndex: currentDayIndex });
    setJustRead(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#87102C] dark:text-white/50 dark:hover:text-[#FFB3C1]"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        {currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <Flame size={12} /> {currentStreak} day{currentStreak === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <header className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
          {plan.title} · Day {currentDayIndex} of {plan.durationDays}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#111] dark:text-white">
          {day.referenceLabel}
        </h1>
        <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
          About {day.estimatedMinutes} minute{day.estimatedMinutes === 1 ? "" : "s"} · {translation.code}
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {day.Portions.map((portion) => (
          <Portion key={portion.sequence} portion={portion} translation={translation.code} />
        ))}
      </div>

      {day.reflectionPrompt && (
        <div className="mt-8 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
            To sit with
          </p>
          <p className="mt-1.5 text-sm text-gray-700 dark:text-white/70">{day.reflectionPrompt}</p>
        </div>
      )}

      {/* One button, at the end of the reading rather than the top, so it is
          reached by finishing rather than by scrolling past. */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6 dark:border-white/10">
        {done ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check size={16} /> Read
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={uncomplete.isPending}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 disabled:opacity-50 dark:text-white/40 dark:hover:text-white"
            >
              {uncomplete.isPending ? "Undoing..." : "Undo"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={markRead}
            disabled={complete.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {complete.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {complete.isPending ? "Saving..." : "Mark as read"}
          </button>
        )}

        {done && (
          <Link
            href="/dashboard"
            className="ml-auto text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            Back to dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

function Portion({ portion, translation }: { portion: DayPortion; translation: string }) {
  const { data, isLoading, error } = usePassage(
    portion.startVerseId,
    portion.endVerseId,
    translation,
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 dark:border-white/10 dark:text-white/40">
        Could not load this passage. Check your connection and try again.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-[#111] dark:text-white">{data.reference}</h2>
        {portion.label && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">
            {portion.label}
          </span>
        )}
      </div>

      {/* Verse numbers sit inline and small: present enough to find a verse,
          quiet enough to read a paragraph without tripping over them. */}
      <div className="space-y-2 text-[15px] leading-relaxed text-gray-800 dark:text-white/80">
        {data.verses.map((verse) => (
          <p key={verse.verseId}>
            <span className="mr-1.5 align-super text-[10px] font-bold text-[#87102C]/70 dark:text-[#FFB3C1]/70">
              {verse.verse}
            </span>
            {verse.text}
          </p>
        ))}
      </div>
    </section>
  );
}
