"use client";

import type { PrayerWatchOverviewData } from "@/lib/api/prayer-watch-overview";
import { durationWords, hoursSince, plural } from "./format";

/** One labelled number; the label says what it is, the note says what it means. */
function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="text-sm font-medium text-gray-500 dark:text-white/55">{label}</span>
      <span className="text-2xl font-semibold text-[#1A1210] dark:text-white">{value}</span>
      {note && <span className="text-xs text-gray-500 dark:text-white/50">{note}</span>}
    </div>
  );
}

/** The headline: how many people are keeping the watch, and the few numbers that frame it. */
export default function OverviewStats({ data }: { data: PrayerWatchOverviewData }) {
  const { totals } = data;
  const members = totals.confirmed - totals.workers;
  const watchesWithPeople = data.slots.filter((s) => s.confirmed > 0).length;
  const waitingNote = data.oldestPendingAt ? `Oldest has waited ${durationWords(hoursSince(data.oldestPendingAt))}` : "Nobody is waiting";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-[#1A1210] p-5 text-white dark:bg-white/[0.06]">
        <span className="text-sm font-medium text-white/70">People keeping the watch</span>
        <span className="text-6xl font-semibold leading-none">{totals.confirmed.toLocaleString("en-GB")}</span>
        <span className="text-sm text-white/70">
          Across {plural(watchesWithPeople, "watch", "watches")} of {data.slots.length}, every night Monday to Saturday
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Tile label="Waiting for approval" value={totals.pending.toLocaleString("en-GB")} note={waitingNote} />
        <Tile
          label="Typical wait for an answer"
          value={data.medianWaitHours === null ? "No data yet" : durationWords(data.medianWaitHours)}
          note="Middle of the last 90 days of decisions"
        />
        <Tile label="Workers on the watch" value={totals.workers.toLocaleString("en-GB")} note={`Serving in a unit, alongside ${plural(members, "member")}`} />
        <Tile
          label="Reflections in the last 30 days"
          value={totals.reflections30d.toLocaleString("en-GB")}
          note={`${plural(totals.reflectionsTotal, "reflection")} shared since the watch began`}
        />
      </div>
    </div>
  );
}
