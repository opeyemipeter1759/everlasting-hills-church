"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { PipelineRow } from "@/lib/api/pipeline";
import { useCorrectFirstVisit } from "@/lib/api/first-timer-visits";
import { visitDayError } from "@/lib/first-timer/visit-day";
import { shortDate } from "../status";
import { VisitDayField } from "./VisitDayField";

/**
 * Staff correction of the first visit date, e.g. when a paper card was typed
 * in days later. It moves the month they count in on the Overview, so it must
 * stay before their other visits.
 */
export function FirstVisitEditor({ person }: { person: PipelineRow }) {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(person.firstVisitDate);
  const correct = useCorrectFirstVisit(person.visitorId);
  const next = person.visitDates.find((d) => d !== person.firstVisitDate);
  const error = visitDayError(day) ?? (next && day >= next ? `It must be before their next visit on ${shortDate(next)}` : null);

  async function save() {
    if (error) return;
    try {
      await correct.mutateAsync(day);
      toast.success(`First visit set to ${shortDate(day)}`);
      setEditing(false);
    } catch (err) {
      toast.error((err as { message?: string })?.message || "The date did not save. Try again.");
    }
  }

  if (!editing) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-white/60">
        First visit {shortDate(person.firstVisitDate)}.
        <button
          type="button"
          onClick={() => {
            setDay(person.firstVisitDate);
            setEditing(true);
          }}
          className="min-h-[36px] font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
        >
          Correct the date
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
      <VisitDayField label="When did they first come?" value={day} onChange={setDay} error={day === person.firstVisitDate ? null : error} />
      <p className="text-xs text-gray-500 dark:text-white/45">This also moves the month they count in on the Overview.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!!error || day === person.firstVisitDate || correct.isPending}
          className="min-h-[40px] rounded-lg bg-[#87102C] px-4 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {correct.isPending ? "Saving..." : "Save date"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-[40px] rounded-lg px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-white/65 dark:hover:bg-white/[0.06]">
          Cancel
        </button>
      </div>
    </div>
  );
}
