"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubmitWatchReport, type LedWatch, type WatchReport } from "@/lib/api/prayer-watch-reports";
import { userMessageForError } from "@/lib/api/user-message";
import { durationLong, minutesBetween, nightWeekday } from "@/lib/prayer-watch-nights";
import HandoverToggle from "./HandoverToggle";
import { fieldCls, hintCls, labelCls } from "./ui";

const updatedWords = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));

/** One night's report for one watch. Remounted per night, so it always starts from what was filed. */
export default function ReportForm({ watch, night, report }: { watch: LedWatch; night: string; report: WatchReport | null }) {
  const submit = useSubmitWatchReport();
  const [start, setStart] = useState(report?.startTime ?? watch.startTime);
  const [end, setEnd] = useState(report?.endTime ?? watch.endTime);
  const [people, setPeople] = useState(report ? String(report.peoplePresent) : "");
  const [handedOver, setHandedOver] = useState(report?.handedOver ?? false);
  const [someoneElse, setSomeoneElse] = useState(report?.handedOverTo && report.handedOverTo !== watch.next?.leaderName ? report.handedOverTo : "");
  const [notes, setNotes] = useState(report?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const minutes = minutesBetween(start, end);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    const count = Number(people);
    if (minutes === null) return setError("The finish time needs to be after the start time, on the same night.");
    if (people.trim() === "" || !Number.isInteger(count) || count < 0) return setError("Add how many people prayed, even if it was just you.");
    try {
      await submit.mutateAsync({
        slotId: watch.id,
        nightDate: night,
        startTime: start,
        endTime: end,
        peoplePresent: count,
        handedOver,
        handedOverTo: handedOver && someoneElse.trim() ? someoneElse.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(userMessageForError(err, "Couldn't send the report. Please try again."));
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-[#111] dark:text-white">{nightWeekday(night)} night</h2>
        <p className={hintCls}>{report ? `Report sent. Last changed ${updatedWords(report.updatedAt)}.` : "No report yet for this night."}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={labelCls}>When did the watch run?</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={hintCls}>Started</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${fieldCls} tabular-nums`} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className={hintCls}>Finished</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${fieldCls} tabular-nums`} required />
          </label>
        </div>
        <p className={`text-sm ${minutes === null ? "text-amber-700 dark:text-amber-300" : "text-gray-600 dark:text-white/65"}`} aria-live="polite">
          {minutes === null ? "Those times don't make a watch. Check the finish is after the start." : `${durationLong(minutes)} of prayer`}
        </p>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>How many prayed?</span>
        <span className={hintCls}>Everyone on the call, yourself included.</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={1000}
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className={`${fieldCls} mt-1 max-w-[140px] tabular-nums`}
          placeholder="0"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelCls}>{watch.next ? "The handover" : "Closing the night"}</span>
        <HandoverToggle watch={watch} checked={handedOver} onChange={setHandedOver} someoneElse={someoneElse} onSomeoneElse={setSomeoneElse} />
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>
          Anything the church should know? <span className="font-normal text-gray-500 dark:text-white/50">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${fieldCls} mt-1`}
          placeholder="Prayer points, a testimony, anything that came up on the watch."
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-bold text-white transition-colors hover:bg-[#6d0d24] disabled:opacity-60 dark:bg-[#FFB3C1] dark:text-[#2A0912] dark:hover:bg-[#ffc7d2]"
        >
          {submit.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {report ? "Update the report" : "Send the report"}
        </button>
        {sent && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} aria-hidden="true" /> Thank you for keeping the watch.
          </p>
        )}
      </div>
    </form>
  );
}
