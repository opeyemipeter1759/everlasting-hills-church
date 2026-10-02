"use client";

import { Headphones, Loader2, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { Select } from "@/components/ui/select";
import { RATES, useReadAloud } from "./read-aloud";

/**
 * Listening to the day's reading.
 *
 * The card sits above the passages with the start button, speed and voice.
 * While reading aloud, a small bar floats above the bottom tabs with pause,
 * the passage skips and stop, because the verse being read scrolls the page
 * away from the card. Nothing renders where the browser has no speech voices,
 * rather than a button that cannot work.
 */
export function ListenBar() {
  const audio = useReadAloud();
  if (!audio?.supported) return null;

  const { status, ready, rate, voices, voiceURI, error, current, passageCount } = audio;
  const active = status === "playing" || status === "paused";
  const primaryLabel = !ready
    ? "Preparing audio…"
    : status === "playing"
      ? "Pause"
      : status === "paused"
        ? "Resume"
        : status === "finished"
          ? "Listen again"
          : "Listen";

  return (
    <>
      <section
        aria-label="Listen to this reading"
        className="mt-5 rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={status === "playing" ? audio.pause : audio.play}
            disabled={!ready}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
          >
            {!ready ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : status === "playing" ? (
              <Pause size={16} aria-hidden="true" />
            ) : status === "paused" ? (
              <Play size={16} aria-hidden="true" />
            ) : (
              <Headphones size={16} aria-hidden="true" />
            )}
            {primaryLabel}
          </button>
          <p aria-live="polite" className="min-w-0 flex-1 text-xs leading-relaxed text-[#8a7e80] dark:text-white/45">
            {active && current
              ? `${status === "paused" ? "Paused at" : "Reading"} ${current.reference}`
              : status === "finished"
                ? "Finished. Mark today as read below when you are ready."
                : "Hear today’s passages read aloud, with the verse being read highlighted."}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            aria-label="Reading speed"
            prefixLabel="Speed"
            value={String(rate)}
            onChange={(value) => audio.setRate(Number(value))}
            options={RATES.map((option) => ({ value: String(option), label: `${option}×` }))}
            className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-900 dark:text-white/70"
          />
          {voices.length > 1 && (
            <Select
              aria-label="Voice"
              prefixLabel="Voice"
              value={voiceURI ?? ""}
              onChange={audio.setVoice}
              options={voices.map((voice) => ({
                value: voice.voiceURI,
                label: voice.name.replace(/^(Microsoft|Google)\s+/, ""),
                hint: voice.lang,
              }))}
              className="min-h-11 min-w-0 max-w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-900 dark:text-white/70"
            />
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </section>

      {active && (
        <div
          role="region"
          aria-label="Audio controls"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-1 rounded-2xl bg-[#2a0410] p-1.5 text-white shadow-lg shadow-black/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]"
        >
          <button
            type="button"
            onClick={() => audio.skip(-1)}
            aria-label="Previous passage"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-white/10"
          >
            <SkipBack size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={status === "playing" ? audio.pause : audio.play}
            aria-label={status === "playing" ? "Pause listening" : "Resume listening"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25"
          >
            {status === "playing" ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => audio.skip(1)}
            disabled={passageCount < 2}
            aria-label="Next passage"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-40"
          >
            <SkipForward size={17} aria-hidden="true" />
          </button>
          <p className="min-w-0 flex-1 truncate px-1.5 text-xs font-semibold">
            {current?.label ? <span className="mr-1 font-bold uppercase tracking-wider text-[#FFB3C1]">{current.label}</span> : null}
            {current?.reference}
          </p>
          <button
            type="button"
            onClick={audio.stop}
            aria-label="Stop listening"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-white/10"
          >
            <Square size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
