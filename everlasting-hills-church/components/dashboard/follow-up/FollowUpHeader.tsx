"use client";

import { CalendarDays, PhoneCall } from "lucide-react";
import { useMe } from "@/lib/api";
import { freshness, RefreshButton, WeekProgress } from "./header-parts";
import { StatCards } from "./StatCards";
import { useFollowUpSummary } from "./useFollowUpSummary";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function FollowUpHeader() {
  const { data: me } = useMe();
  const summary = useFollowUpSummary();
  const firstName = me?.member?.firstName ?? null;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="space-y-3">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#87102C] via-[#9B1435] to-[#5E0A1E] px-6 py-7 text-white shadow-xl shadow-[#87102C]/25 sm:px-8">
        {/* Depth, without an image to load: two soft lights and a fine grid. */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#FFB3C1]/10 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
              <CalendarDays size={13} aria-hidden="true" />
              {today}
            </p>
            <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold leading-tight sm:text-[28px]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/20">
                <PhoneCall size={19} aria-hidden="true" />
              </span>
              Follow Up
            </h1>
            <p className="mt-2 flex max-w-md flex-wrap items-center gap-x-1 text-sm text-white/70">
              {firstName ? `${greeting()}, ${firstName}.` : null}
              {/* Until the figures land, say nothing: "Everyone has been
                  reached" would be a claim we can't yet make. */}
              {summary.isLoading ? (
                <span className="inline-block h-4 w-56 animate-pulse rounded bg-white/20" />
              ) : summary.toCall > 0 ? (
                <span>
                  {summary.toCall} {summary.toCall === 1 ? "person is" : "people are"} waiting to hear from the church
                  today.
                </span>
              ) : (
                <span>Everyone has been reached. Nobody is waiting on a call.</span>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <RefreshButton onClick={summary.refresh} busy={summary.isFetching} />
            <span className="text-[11px] text-white/50">
              {summary.isFetching ? "Refreshing…" : freshness(summary.updatedAt)}
            </span>
          </div>
        </div>

    {/*     {!summary.denied && summary.total > 0 && (
          <div className="relative">
            <WeekProgress percent={summary.progress} reached={summary.reachedThisWeek} total={summary.total} />
          </div>
        )} */}
      </header>

      {!summary.denied && <StatCards summary={summary} />}
    </section>
  );
}
