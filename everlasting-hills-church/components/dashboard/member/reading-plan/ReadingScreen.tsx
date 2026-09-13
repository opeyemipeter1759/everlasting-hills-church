"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  PenLine,
} from "lucide-react";
import WordTabs from "./WordTabs";
import {
  useCompleteDay,
  useCompletedDays,
  usePassage,
  usePlanDay,
  useSetTranslation,
  useTodayReading,
  useTranslations,
  useUncompleteDay,
  type DayPortion,
  type PlanDay,
} from "@/lib/api/reading-plan";

/**
 * The reading screen: scripture, then one button.
 *
 * Any day of the plan can be opened, not only today's. A member who missed a
 * week wants to read what they missed rather than be told a number, and one
 * with ten spare minutes wants to read ahead. Both are addressed by day index,
 * so completing an earlier day is the same idempotent call as completing today.
 */
export default function ReadingScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const parsedDay = Number(params.get("day"));
  const { data, isLoading, isError, refetch } = useTodayReading();
  const requestedDay = Number.isInteger(parsedDay) && parsedDay > 0 &&
    parsedDay <= (data?.plan.durationDays ?? 0) ? parsedDay : null;
  const complete = useCompleteDay();
  const uncomplete = useUncompleteDay();
  const setTranslation = useSetTranslation();
  const { data: translations } = useTranslations();
  const { data: completed } = useCompletedDays(data?.subscriptionId);

  const [justChanged, setJustChanged] = useState<{ subscriptionId: string; dayIndex: number; done: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // A day other than the current one comes from the plan itself, which is
  // immutable and cached for a year.
  const browsing = requestedDay !== null && requestedDay !== data?.currentDayIndex;
  const { data: browsedDay, isLoading: browsedLoading, isError: browsedError, refetch: retryDay } = usePlanDay(
    browsing ? data?.plan.id : undefined,
    browsing ? requestedDay : undefined,
  );

  if (isLoading) {
    return (
      <div className="mx-auto min-w-0 max-w-2xl space-y-4 py-8">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (isError) return <ReadingError onRetry={() => refetch()} />;
  if (!data) return <NoPlan />;

  const dayIndex = requestedDay ?? data.currentDayIndex;
  const day: PlanDay | null | undefined = browsing ? browsedDay : data.day;
  const { plan, subscriptionId, translation, currentDayIndex, currentStreak, completedDays } = data;

  const completedSet = new Set(completed?.dayIndexes ?? []);
  const isDone =
    justChanged?.subscriptionId === subscriptionId && justChanged.dayIndex === dayIndex
      ? justChanged.done
      : completedSet.has(dayIndex);

  function goToDay(next: number) {
    if (next < 1 || next > plan.durationDays) return;
    setJustChanged(null);
    setActionError(null);
    router.push(next === currentDayIndex ? "/dashboard/reading" : `/dashboard/reading?day=${next}`);
  }

  async function markRead() {
    setActionError(null);
    try {
      await complete.mutateAsync({ subscriptionId, dayIndex });
      setJustChanged({ subscriptionId, dayIndex, done: true });
      // Stay on the passage just read even when the server advances the plan.
      router.replace(`/dashboard/reading?day=${dayIndex}`, { scroll: false });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not save your reading. Please try again.");
    }
  }

  async function undo() {
    setActionError(null);
    try {
      await uncomplete.mutateAsync({ subscriptionId, dayIndex });
      setJustChanged({ subscriptionId, dayIndex, done: false });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not undo this reading. Please try again.");
    }
  }

  if (browsing && browsedLoading) {
    return (
      <div className="mx-auto min-w-0 max-w-2xl space-y-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>
    );
  }

  if (browsing && (browsedError || !day)) return <ReadingError onRetry={() => retryDay()} />;
  if (!day) return <NoPlan finished />;

  return (
    <div className="mx-auto min-w-0 max-w-2xl break-words py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-3 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WordTabs />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:w-auto">
          {currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Flame size={12} /> {currentStreak} day{currentStreak === 1 ? "" : "s"}
            </span>
          )}
          {/* Translation belongs on the reading screen, where a verse that reads
              oddly is the reason somebody reaches for another one. */}
          {translations && translations.length > 1 && (
            <select
              aria-label="Translation"
              value={translation.code}
              disabled={setTranslation.isPending}
              onChange={(e) =>
                setTranslation.mutate({ subscriptionId, translationCode: e.target.value })
              }
              className="min-h-11 max-w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 dark:border-white/10 dark:bg-gray-900 dark:text-white/70"
            >
              {translations.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {setTranslation.isError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">Could not change translation. Please try again.</p>}

      {/* Day stepper. Every established plan has one; theirs walks the calendar,
          this one walks the plan, because a plan here advances when somebody
          reads rather than when the date turns. */}
      <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-2 dark:border-white/10 dark:bg-white/[0.03]">
        <button
          type="button"
          onClick={() => goToDay(dayIndex - 1)}
          disabled={dayIndex <= 1}
          aria-label="Previous day"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-white/50 dark:hover:bg-white/5"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="min-w-0 text-center">
          <p className="text-xs font-bold text-[#111] dark:text-white">
            Day {dayIndex} of {plan.durationDays}
          </p>
          {browsing && (
            <button
              type="button"
              onClick={() => goToDay(currentDayIndex)}
              className="min-h-11 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
            >
              Back to today (day {currentDayIndex})
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => goToDay(dayIndex + 1)}
          disabled={dayIndex >= plan.durationDays}
          aria-label="Next day"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-white/50 dark:hover:bg-white/5"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <header className="mt-5">
        {/* The plan mark, small. On the reading screen the passage is the
            headline; the artwork is only here to say which plan you are in. */}
        <div className="flex items-center gap-2.5">
          {plan.coverImageUrl && (
            <span className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md bg-[#4A0817]">
              <Image src={plan.coverImageUrl} alt="" fill sizes="28px" className="object-cover" unoptimized />
            </span>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
            {plan.title}
          </p>
        </div>
        <h1 className="mt-2 break-words font-serif text-2xl font-bold tracking-tight text-[#111] dark:text-white sm:text-3xl">
          {day.referenceLabel}
        </h1>
        <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
          About {day.estimatedMinutes} minute{day.estimatedMinutes === 1 ? "" : "s"} ·{" "}
          {translation.code}
        </p>

        {/* Progress as a line rather than a number: on day 253 of 365 a counter
            barely moves and a bar still does. */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[#87102C] transition-all duration-500 dark:bg-[#FFB3C1]"
              style={{ width: `${Math.min(100, (completedDays / plan.durationDays) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3">
            <p className="text-[11px] text-[#8a7e80] dark:text-white/40">
              {completedDays} of {plan.durationDays} days read
            </p>
            <Link
              href="/dashboard/reading/schedule"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
            >
              <CalendarDays size={11} /> Whole plan
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-[#8a7e80] dark:text-white/45">Your pace, your progress. Read ahead or return to any day in the plan.</p>
        </div>
      </header>

      {/* What the day holds, before the text of it. On a four portion morning a
          reader sees the shape and can jump to the part they want. */}
      {day.Portions.length > 1 && (
        <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Today's passages">
          {day.Portions.map((portion) => (
            <a
              key={portion.sequence}
              href={`#portion-${portion.sequence}`}
              className="rounded-xl border border-gray-200 bg-white p-3 text-center transition-colors hover:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#FFB3C1]/30"
            >
              <BookOpen size={14} className="mx-auto text-[#87102C]/70 dark:text-[#FFB3C1]/70" />
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/35">
                {portion.label ?? `Reading ${portion.sequence}`}
              </p>
            </a>
          ))}
        </nav>
      )}

      <div className="mt-6 space-y-8">
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

      <WriteAboutThis day={day} />
      {actionError && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6 dark:border-white/10">
        {isDone ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Check size={16} /> Read
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={uncomplete.isPending}
              className="min-h-11 px-2 text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-white/50 dark:hover:text-white"
            >
              {uncomplete.isPending ? "Undoing..." : "Undo"}
            </button>
            {dayIndex < plan.durationDays && (
              <button
                type="button"
                onClick={() => goToDay(dayIndex + 1)}
                className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
              >
                Next day <ChevronRight size={14} />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={markRead}
            disabled={complete.isPending}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60 sm:w-auto"
          >
            {complete.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {complete.isPending ? "Saving..." : "Mark as read"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The bridge from reading to writing.
 *
 * A member who has just finished a passage is the person most likely to have
 * something to say about it, and this is the only moment they will have the
 * reference to hand. The citation travels in the query string so the editor
 * opens with the passage already attached.
 *
 * The range spans the whole day rather than one portion, which is what
 * referenceLabel already describes — on a four portion morning it is the day
 * that was read, not any single reading.
 */
function WriteAboutThis({ day }: { day: PlanDay }) {
  if (!day.Portions.length) return null;

  const start = Math.min(...day.Portions.map((p) => p.startVerseId));
  const end = Math.max(...day.Portions.map((p) => p.endVerseId));
  const href = `/dashboard/articles/write?start=${start}&end=${end}&label=${encodeURIComponent(
    day.referenceLabel,
  )}`;

  return (
    <Link
      href={href}
      className="group mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 p-4 transition-colors hover:border-[#87102C]/40 hover:bg-[#FFF4F6]/40 dark:border-white/10 dark:hover:border-[#FFB3C1]/30 dark:hover:bg-white/[0.03]"
    >
      <PenLine
        size={17}
        className="flex-shrink-0 text-gray-400 group-hover:text-[#87102C] dark:text-white/30 dark:group-hover:text-[#FFB3C1]"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#111] dark:text-white">
          Write about {day.referenceLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-[#8a7e80] dark:text-white/40">
          Share what you saw with the church. A few paragraphs is plenty.
        </p>
      </div>
      <ChevronRight
        size={15}
        className="ml-auto flex-shrink-0 text-gray-300 group-hover:text-[#87102C] dark:text-white/20 dark:group-hover:text-[#FFB3C1]"
      />
    </Link>
  );
}

function ReadingError({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto max-w-2xl py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]"><WordTabs /><div role="alert" className="mt-6 rounded-2xl border border-red-200 p-4 text-sm dark:border-red-900"><p>Could not load your reading. Check your connection and try again.</p><button type="button" onClick={onRetry} className="mt-2 min-h-11 font-bold text-[#87102C] dark:text-[#FFB3C1]">Try again</button></div></div>;
}

function NoPlan({ finished }: { finished?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <WordTabs />
      <div className="mt-10 text-center">
        <BookOpen size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
          {finished ? "You have finished this plan." : "You have not chosen a reading plan yet."}
        </p>
        <Link
          href="/dashboard/reading/plans"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
        >
          {finished ? "Start another plan" : "Choose a plan"}
        </Link>
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
    <section id={`portion-${portion.sequence}`} className="scroll-mt-6 break-words">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
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
