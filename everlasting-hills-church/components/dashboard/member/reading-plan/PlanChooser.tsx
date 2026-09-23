"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Clock, Loader2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Modal from "@/components/ui/overlay/Modal";
import { Select } from "@/components/ui/select";
import WordTabs from "./WordTabs";
import { readingHref, useReadingPlans, useReadingSubscriptions, useSubscribeToPlan, useTranslations, type ReadingIntensity, type ReadingPlanSummary, type ReadingTrack } from "@/lib/api/reading-plan";

const EFFORT: Record<ReadingIntensity, { label: string; time: string }> = {
  LOW: { label: "Low", time: "Up to 5 min/day" },
  MEDIUM: { label: "Medium", time: "6–15 min/day" },
  HIGH: { label: "High", time: "Over 15 min/day" },
};

// Older cached catalogue responses may not include intensity yet.
function intensityFor(plan: ReadingPlanSummary): ReadingIntensity | null {
  return plan.intensity ?? (plan.avgMinutesPerDay == null ? null :
    plan.avgMinutesPerDay <= 5 ? "LOW" : plan.avgMinutesPerDay <= 15 ? "MEDIUM" : "HIGH");
}

export default function PlanChooser() {
  const router = useRouter();
  const { data: plans, isLoading, isError, refetch } = useReadingPlans();
  const { data: subscriptions, isLoading: currentLoading, isError: currentError, refetch: retrySubscriptions } = useReadingSubscriptions();
  const { data: translations } = useTranslations();
  const subscribe = useSubscribeToPlan();
  const [effort, setEffort] = useState<ReadingIntensity | "ALL">("ALL");
  const [duration, setDuration] = useState("ALL");
  const [search, setSearch] = useState("");
  const [familiarity, setFamiliarity] = useState<ReadingTrack | "">("");
  const [selected, setSelected] = useState<ReadingPlanSummary | null>(null);
  const [translationCode, setTranslationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activePlans = (subscriptions ?? []).filter((subscription) => subscription.status === "ACTIVE");
  const selectedPaused = (subscriptions ?? []).find((subscription) => subscription.plan.id === selected?.id && subscription.status === "PAUSED");

  const visiblePlans = (plans ?? []).filter((plan) => {
    if (effort !== "ALL" && intensityFor(plan) !== effort) return false;
    if (duration === "SHORT" && plan.durationDays > 31) return false;
    if (duration === "MEDIUM" && (plan.durationDays <= 31 || plan.durationDays > 180)) return false;
    if (duration === "LONG" && plan.durationDays <= 180) return false;
    return `${plan.title} ${plan.subtitle ?? ""} ${plan.description ?? ""}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });
  // Recommend from the live, filtered catalogue, including newly added plans.
  const recommended = familiarity ? [...visiblePlans].sort((a, b) =>
    Number(b.track === familiarity) - Number(a.track === familiarity) ||
    (a.avgMinutesPerDay ?? Infinity) - (b.avgMinutesPerDay ?? Infinity) ||
    a.durationDays - b.durationDays || a.title.localeCompare(b.title),
  )[0] : null;
  const chosenTranslation = translationCode || selectedPaused?.translation.code || activePlans[0]?.translation.code ||
    translations?.find((translation) => translation.isDefault)?.code || translations?.[0]?.code;

  function resetFilters() {
    setEffort("ALL");
    setDuration("ALL");
    setSearch("");
  }

  async function startPlan() {
    if (!selected) return;
    setError(null);
    try {
      const subscription = await subscribe.mutateAsync({
        planId: selected.id,
        translationCode: chosenTranslation,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos",
      });
      router.push(readingHref(subscription.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start this plan. Please try again.");
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl px-0 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-3 sm:py-6">
      <WordTabs />
      <header className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">A rhythm that fits your life</p>
        <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#111] dark:text-white sm:text-3xl">Choose a Bible plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8a7e80] dark:text-white/50">
          Start with a few minutes or make room for a longer reading. Every plan is self-paced:
          its day advances when you read. Read several plans together, each with its own progress.
        </p>
        {!!subscriptions?.length && <Link href="/dashboard/reading/overview" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          {activePlans.length} {activePlans.length === 1 ? "plan" : "plans"} in progress · View your overview
        </Link>}
      </header>

      <section aria-label="Find a reading plan" className="mt-6 space-y-4 rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/40 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-gray-700 dark:text-white/80">Daily effort</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={effort === value} onClick={() => setEffort(value)}
                className={`min-h-[60px] rounded-xl border px-2 py-2 text-left transition-colors sm:px-3 ${effort === value ? "border-[#87102C] bg-[#87102C] text-white" : "border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75"}`}>
                <span className="block text-sm font-bold">{value === "ALL" ? "All plans" : EFFORT[value].label}</span>
                <span className="mt-0.5 block text-[11px] opacity-80">{value === "ALL" ? "Any daily reading time" : EFFORT[value].time}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-white/65">
            Plan length
            <Select
              aria-label="Plan length"
              value={duration}
              onChange={setDuration}
              className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-gray-900"
              options={[
                { value: "ALL", label: "Any length" },
                { value: "SHORT", label: "Up to 31 days" },
                { value: "MEDIUM", label: "32–180 days" },
                { value: "LONG", label: "Over 180 days" },
              ]}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-white/65">
            Suggest a plan for me
            <Select
              aria-label="Suggest a plan for me"
              value={familiarity}
              onChange={(track) => setFamiliarity(track as ReadingTrack | "")}
              placeholder="Choose familiarity (optional)"
              className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-gray-900"
              options={[
                { value: "NEW_BELIEVER", label: "I am new to the Bible" },
                { value: "GROWING", label: "I know some of it" },
                { value: "MATURE", label: "I read regularly" },
              ]}
            />
          </label>
        </div>
        <label className="relative block">
          <span className="sr-only">Search plans</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-gray-400" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books or plans" className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-gray-900 dark:text-white" />
        </label>
      </section>

      {isLoading ? <div role="status" className="mt-6 grid gap-4 sm:grid-cols-2"><span className="sr-only">Loading reading plans</span>{[0, 1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />)}</div> : isError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 p-4 text-sm dark:border-red-900">
          Could not load the plans. <button type="button" onClick={() => refetch()} className="min-h-11 px-2 font-bold text-[#87102C] dark:text-[#FFB3C1]">Try again</button>
        </div>
      ) : <>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-xs text-[#8a7e80] dark:text-white/50">{visiblePlans.length} {visiblePlans.length === 1 ? "plan" : "plans"} · daily times are estimates</p>
          {(effort !== "ALL" || duration !== "ALL" || search) && <button type="button" onClick={resetFilters} className="min-h-11 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1]">Clear filters</button>}
        </div>
        {recommended && <p role="status" className="mb-3 text-sm text-gray-600 dark:text-white/65">Suggested for you: <strong>{recommended.title}</strong>, within your selected time and length.</p>}
        {visiblePlans.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-white/10"><p className="text-sm text-gray-600 dark:text-white/65">No plans match these filters.</p><button type="button" onClick={resetFilters} className="mt-2 min-h-11 font-semibold text-[#87102C] dark:text-[#FFB3C1]">Show all plans</button></div> :
          <div className="mt-3 grid items-stretch gap-4 sm:grid-cols-2">
            {visiblePlans.map((plan) => {
              const intensity = intensityFor(plan);
              const active = activePlans.find((subscription) => subscription.plan.id === plan.id);
              const paused = (subscriptions ?? []).find((subscription) => subscription.plan.id === plan.id && subscription.status === "PAUSED");
              return <article key={plan.id} aria-label={plan.title} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.03] ${recommended?.id === plan.id ? "border-[#87102C]/50 dark:border-[#FFB3C1]/50" : "border-gray-200 dark:border-white/10"}`}>
                <div className="relative flex min-h-40 items-end overflow-hidden bg-[#4A0817] p-4">
                  {plan.coverImageUrl && <Image src={plan.coverImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" unoptimized />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative min-w-0">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {recommended?.id === plan.id && <span className="rounded-full bg-[#87102C] px-2 py-1 text-[10px] font-bold text-white">Suggested</span>}
                      {active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"><Check size={11} /> Reading now</span>}
                      {!active && paused && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">Paused · {paused.completedDays} days read</span>}
                    </div>
                    <h2 className="break-words font-serif text-xl font-bold leading-tight text-white">{plan.title}</h2>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                    <span className="rounded-full bg-[#FFF4F6] px-2.5 py-1 dark:bg-[#87102C]/25">{intensity ? `${EFFORT[intensity].label} effort` : "Flexible reading"}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={13} /> {plan.avgMinutesPerDay == null ? "Time varies" : `~${plan.avgMinutesPerDay} min/day`}</span>
                    <span>{plan.durationDays} days</span>
                  </div>
                  {plan.subtitle && <p className="mt-3 text-sm text-gray-700 dark:text-white/70">{plan.subtitle}</p>}
                  {plan.description && <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-white/50">{plan.description}</p>}
                  {active ? <Link href={readingHref(active.subscriptionId)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24]">
                    <BookOpen size={15} /> Continue reading
                  </Link> : <button type="button" onClick={() => { setError(null); setTranslationCode(""); setSelected(plan); }} disabled={subscribe.isPending || currentLoading || currentError}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50">
                    <BookOpen size={15} /> {paused ? "Resume this plan" : "Choose this plan"}
                  </button>}
                </div>
              </article>;
            })}
          </div>}
      </>}
      {currentError && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">Could not load your current plans. <button type="button" onClick={() => retrySubscriptions()} className="min-h-11 font-semibold underline">Try again</button></p>}

      <Modal open={Boolean(selected)} onClose={() => { if (!subscribe.isPending) setSelected(null); }} title={selectedPaused ? "Resume your Bible plan" : "Start your Bible plan"}>
        {selected && <div className="space-y-4">
          <div><p className="break-words font-serif text-xl font-bold text-gray-900 dark:text-white">{selected.title}</p><p className="mt-1 text-sm text-gray-500 dark:text-white/60">{selected.durationDays} days{selected.avgMinutesPerDay != null ? ` · about ${selected.avgMinutesPerDay} min/day` : ""}</p></div>
          <p className="rounded-xl bg-[#FFF4F6] p-3 text-sm leading-relaxed text-[#6E0C24] dark:bg-[#87102C]/20 dark:text-[#FFB3C1]">
            {selectedPaused ? `Continue from day ${selectedPaused.currentDayIndex}, with your ${selectedPaused.completedDays} completed days saved.` : "This plan starts at day 1. Your other plans stay active, each with its own progress."}
          </p>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-white/65">Read at your own pace. You can do more than one day or take a break; unread days stay ready for you.</p>
          {!selectedPaused && translations && translations.length > 0 && <label className="block text-sm font-semibold text-gray-700 dark:text-white/75">Bible translation<Select aria-label="Bible translation" value={chosenTranslation ?? ""} onChange={setTranslationCode} disabled={subscribe.isPending} className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-gray-900" options={translations.map((translation) => ({ value: translation.code, label: `${translation.code} — ${translation.name}` }))} /></label>}
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setSelected(null)} disabled={subscribe.isPending} className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 disabled:opacity-50 dark:border-white/10 dark:text-white/70">Cancel</button>
            <button type="button" onClick={startPlan} disabled={subscribe.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{subscribe.isPending && <Loader2 size={15} className="animate-spin" />}{subscribe.isPending ? "Opening…" : selectedPaused ? "Resume reading" : "Start reading"}</button>
          </div>
        </div>}
      </Modal>
    </div>
  );
}
