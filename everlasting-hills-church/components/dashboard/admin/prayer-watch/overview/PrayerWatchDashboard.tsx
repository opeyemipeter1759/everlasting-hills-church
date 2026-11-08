"use client";

import { Loader2, Quote } from "lucide-react";
import { usePrayerWatchOverview } from "@/lib/api/prayer-watch-overview";
import { userMessageForError } from "@/lib/api/user-message";
import OverviewStats from "./OverviewStats";
import WatchCoverage from "./WatchCoverage";
import WeeklyJoins from "./WeeklyJoins";
import NeedsAttention from "./NeedsAttention";
import HoursPrayed from "./HoursPrayed";
import HandoverChain from "./HandoverChain";
import { durationWords, hoursSince, panel, panelTitle } from "./format";

/** The Prayer Watch at a glance: who is praying, when, what's waiting, and how it's growing. */
export default function PrayerWatchDashboard({ onManage }: { onManage: () => void }) {
  const overview = usePrayerWatchOverview();
  const data = overview.data;

  if (overview.isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" size={22} aria-label="Loading the overview" />
      </div>
    );
  }
  if (overview.isError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
        {userMessageForError(overview.error, "Couldn't load the overview. Please refresh.")}
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-gray-500 dark:text-white/55">The Prayer Watch hasn’t been set up yet. Open Manage to begin.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <OverviewStats data={data} />
      <HoursPrayed reports={data.reports} watches={data.slots.length} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <WatchCoverage slots={data.slots} />
          <HandoverChain reports={data.reports} slots={data.slots} />
          <WeeklyJoins weekly={data.weekly} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <NeedsAttention data={data} onManage={onManage} />
          {data.latestReflection && (
            <section className={panel} aria-labelledby="reflection-title">
              <h2 id="reflection-title" className={panelTitle}>
                Latest reflection
              </h2>
              <blockquote className="mt-3 flex gap-2 text-[15px] leading-relaxed text-[#1A1210] dark:text-white/85">
                <Quote size={16} className="mt-1 flex-shrink-0 text-[#87102C] dark:text-[#E8768A]" aria-hidden="true" />
                <span>{data.latestReflection.excerpt}</span>
              </blockquote>
              <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
                {data.latestReflection.firstName}, {data.latestReflection.watchLabel}, {durationWords(hoursSince(data.latestReflection.createdAt))} ago
              </p>
            </section>
          )}
          <p className="text-xs text-gray-400 dark:text-white/40">
            {data.totals.declined} declined and {data.totals.removed} removed since this watch began. Updates every minute.
          </p>
        </div>
      </div>
    </div>
  );
}
