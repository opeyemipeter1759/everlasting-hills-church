"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  useReadingPlans,
  useSubscribeToPlan,
  useTodayReading,
  type ReadingPlanSummary,
} from "@/lib/api/reading-plan";

/**
 * Choosing a plan.
 *
 * Track names stay in the database. Nobody picks "I am immature", so every plan
 * is labelled by its promise and its cost in minutes, and the router below asks
 * about familiarity and time rather than about spiritual maturity.
 */
type Familiarity = "new" | "some" | "deep";
type TimeBudget = "short" | "medium" | "long";

const RECOMMENDATION: Record<string, string> = {
  "new|short": "start-with-jesus",
  "new|medium": "start-with-jesus",
  "new|long": "start-with-jesus",
  "some|short": "start-with-jesus",
  "some|medium": "know-the-whole-story",
  "some|long": "know-the-whole-story",
  "deep|short": "know-the-whole-story",
  "deep|medium": "know-the-whole-story",
  "deep|long": "the-whole-counsel",
};

export default function PlanChooser() {
  const router = useRouter();
  const { data: plans, isLoading } = useReadingPlans();
  const { data: current } = useTodayReading();
  const subscribe = useSubscribeToPlan();

  const [familiarity, setFamiliarity] = useState<Familiarity | null>(null);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);

  const recommendedSlug =
    familiarity && timeBudget ? RECOMMENDATION[`${familiarity}|${timeBudget}`] : null;

  async function choose(plan: ReadingPlanSummary) {
    // The browser knows the member's zone, and it decides what date their
    // reading is recorded against. Sending it beats assuming Lagos.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";
    await subscribe.mutateAsync({ planId: plan.id, timezone });
    router.push("/dashboard/reading");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#87102C] dark:text-white/50 dark:hover:text-[#FFB3C1]"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">
          Choose a reading plan
        </h1>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
          Your plan moves when you read, not when the calendar does. There is nothing to fall behind
          on.
        </p>
      </header>

      {/* The router. Two questions, and it costs almost nothing to skip. */}
      <div className="mt-6 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
          Not sure? Two questions
        </p>

        <div className="mt-3 space-y-3">
          <Question
            label="How familiar are you with the Bible?"
            options={[
              { value: "new", label: "New to it" },
              { value: "some", label: "I know some of it" },
              { value: "deep", label: "I read regularly" },
            ]}
            value={familiarity}
            onChange={(v) => setFamiliarity(v as Familiarity)}
          />
          <Question
            label="How long each day?"
            options={[
              { value: "short", label: "A few minutes" },
              { value: "medium", label: "Ten or so" },
              { value: "long", label: "As long as it takes" },
            ]}
            value={timeBudget}
            onChange={(v) => setTimeBudget(v as TimeBudget)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {(plans ?? []).map((plan) => {
            const recommended = plan.slug === recommendedSlug;
            const isCurrent = current?.plan.id === plan.id;
            return (
              <article
                key={plan.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  recommended
                    ? "border-[#87102C]/40 bg-[#FFF4F6]/60 dark:border-[#FFB3C1]/30 dark:bg-[#87102C]/10"
                    : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#111] dark:text-white">{plan.title}</h2>
                      {recommended && (
                        <span className="rounded-full bg-[#87102C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          Suggested
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <Check size={10} /> Current
                        </span>
                      )}
                    </div>
                    {plan.subtitle && (
                      <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/50">{plan.subtitle}</p>
                    )}
                  </div>

                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-white/50">
                    <Clock size={11} />
                    {plan.durationDays} days
                  </span>
                </div>

                {plan.description && (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-white/40">
                    {plan.description}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => choose(plan)}
                  disabled={subscribe.isPending || isCurrent}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {subscribe.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <BookOpen size={15} />
                  )}
                  {isCurrent ? "You are reading this" : "Start this plan"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {current && (
        <p className="mt-6 text-xs text-[#8a7e80] dark:text-white/40">
          Starting a new plan pauses your current one. Nothing you have read is lost.
        </p>
      )}
    </div>
  );
}

function Question({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gray-600 dark:text-white/60">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === option.value
                ? "border-transparent bg-[#87102C] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
            }`}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
