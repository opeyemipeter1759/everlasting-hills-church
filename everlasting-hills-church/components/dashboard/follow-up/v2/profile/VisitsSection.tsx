"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useFirstTimerVisits, useUndoVisit, type VisitSource } from "@/lib/api/first-timer-visits";
import { shortDate } from "../status";
import { CameAgainButton } from "../visits/CameAgainButton";
import { FirstVisitEditor } from "../visits/FirstVisitEditor";
import { PossibleReturnBanner } from "../visits/PossibleReturnBanner";
import type { ProfileSectionProps } from "./types";

const SOURCE_LABEL: Record<VisitSource, string> = {
  FORM: "First visit",
  CAME_AGAIN: "Came again",
  RETURN_FORM: "Filled in the form again",
  BACKFILL: "From earlier records",
  BACKFILL_STATUS: "From their earlier status",
};

/**
 * Every visit they have made, Came again, undo, the first visit date, and a
 * possible return visit for staff to settle. Visits are counted by the API;
 * two services on one day are one visit.
 */
export default function VisitsSection({ profile }: ProfileSectionProps) {
  const { person } = profile;
  const visits = useFirstTimerVisits(person.visitorId);
  const undo = useUndoVisit(person.visitorId);
  const [undoing, setUndoing] = useState<string | null>(null);
  const sourceOf = new Map((visits.data?.recorded ?? []).map((r) => [r.date, r.source]));
  const label = (d: string) => (d === person.firstVisitDate ? "First visit" : sourceOf.has(d) ? SOURCE_LABEL[sourceOf.get(d)!] : "Checked in");

  async function confirmUndo() {
    if (!undoing) return;
    try {
      await undo.mutateAsync(undoing);
      toast.success(`Visit on ${shortDate(undoing)} removed`);
      setUndoing(null);
    } catch (err) {
      toast.error((err as { message?: string })?.message || "The visit could not be removed. Try again.");
    }
  }

  return (
    <>
      {person.possibleReturn && <PossibleReturnBanner person={person} />}
      <section aria-label="Visits" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111] dark:text-white">Visits</h2>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-white/60">
              {person.visits} {person.visits === 1 ? "visit" : "visits"}. Two services on one day count as one.
            </p>
          </div>
          <CameAgainButton visitorId={person.visitorId} firstName={person.firstName} firstVisitDate={person.firstVisitDate} />
        </div>
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {person.visitDates.map((d) => (
            <li key={d} className="flex min-h-[44px] items-center justify-between gap-3 py-1.5 text-sm">
              <span>
                <span className="font-medium tabular-nums text-[#111] dark:text-white">{shortDate(d)}</span>
                <span className="ml-2 text-gray-500 dark:text-white/45">{label(d)}</span>
              </span>
              {sourceOf.get(d) === "CAME_AGAIN" && d !== person.firstVisitDate && (
                <button
                  type="button"
                  onClick={() => setUndoing(d)}
                  className="min-h-[36px] rounded-lg px-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/[0.06]"
                  aria-label={`Undo the visit on ${shortDate(d)}`}
                >
                  Undo
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          <FirstVisitEditor key={person.firstVisitDate} person={person} />
        </div>
      </section>
      <ConfirmDialog
        open={!!undoing}
        tone="warning"
        title="Undo this visit?"
        description={undoing ? `The visit on ${shortDate(undoing)} will be removed from ${person.firstName}'s record, and their status worked out again.` : ""}
        confirmLabel="Undo visit"
        loading={undo.isPending}
        onConfirm={confirmUndo}
        onCancel={() => setUndoing(null)}
      />
    </>
  );
}
