"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { fraunces } from "@/lib/fonts/prayer-watch";
import { useMyWatchReports } from "@/lib/api/prayer-watch-reports";
import { userMessageForError } from "@/lib/api/user-message";
import { SKY_GRADIENT, serif, skyAt } from "../sky";
import NightPicker from "./NightPicker";
import ReportForm from "./ReportForm";

/** Where a watch leader tells the church their watch was kept and handed on, night by night. */
export default function WatchReportScreen() {
  const reports = useMyWatchReports();
  const [slotId, setSlotId] = useState<string | null>(null);
  const [night, setNight] = useState<string | null>(null);

  const watches = reports.data?.slots ?? [];
  const watch = watches.find((w) => w.id === slotId) ?? watches[0];
  const chosen = watch?.nights.find((n) => n.night === night) ?? watch?.nights[0];
  const sky = skyAt(watch?.position ?? 0);

  return (
    <div className={`${fraunces.variable} mx-auto max-w-2xl py-6 sm:py-8`}>
      <Link
        href="/dashboard/prayer-watch"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#111] dark:text-white/55 dark:hover:text-white"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Prayer Watch
      </Link>
      <span aria-hidden="true" className="mt-5 block h-1.5 w-16 rounded-full" style={{ background: SKY_GRADIENT }} />
      <h1 style={serif} className="mt-4 text-2xl font-medium text-[#111] dark:text-white xs:text-3xl sm:text-4xl">
        Watch report
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-white/60">
        After each watch, let the church know it was kept. Say when it ran and how many prayed, then confirm you handed over to the next watch.
      </p>

      {reports.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-gray-400">
          <Loader2 className="animate-spin" size={22} aria-label="Loading your watch" />
        </div>
      ) : reports.isError ? (
        <p role="alert" className="mt-8 text-sm text-red-600 dark:text-red-400">
          {userMessageForError(reports.error, "Couldn't load your watch. Please refresh.")}
        </p>
      ) : !watch || !chosen ? (
        <div className="mt-8 rounded-2xl border border-gray-200 p-5 text-sm leading-relaxed text-gray-600 dark:border-white/10 dark:text-white/65">
          Reports are filed by watch leaders. When you&apos;re chosen to lead a watch, this is where you&apos;ll report each night.{" "}
          <Link href="/dashboard/prayer-watch" className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            Back to Prayer Watch
          </Link>
        </div>
      ) : (
        <>
          {watches.length > 1 && (
            <div role="tablist" aria-label="Your watches" className="mt-6 flex flex-wrap gap-2">
              {watches.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="tab"
                  aria-selected={w.id === watch.id}
                  onClick={() => {
                    setSlotId(w.id);
                    setNight(null);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                    w.id === watch.id ? "border-[#111] bg-[#111] text-white dark:border-white dark:bg-white dark:text-[#111]" : "border-gray-200 text-gray-600 dark:border-white/15 dark:text-white/70"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl p-5" style={{ background: sky.bg, color: sky.text }}>
            <p className="text-sm font-medium" style={{ color: sky.sub }}>
              You lead
            </p>
            <p style={serif} className="mt-1 text-2xl font-medium sm:text-3xl">
              {watch.label}
            </p>
            <p className="mt-1 text-sm tabular-nums" style={{ color: sky.sub }}>
              {watch.startTime}–{watch.endTime}, Monday to Saturday
            </p>
          </div>

          <div className="mt-5">
            <NightPicker nights={watch.nights} value={chosen.night} onChange={setNight} accent={sky} />
          </div>
          <ReportForm key={`${watch.id}-${chosen.night}`} watch={watch} night={chosen.night} report={chosen.report} />
        </>
      )}
    </div>
  );
}
