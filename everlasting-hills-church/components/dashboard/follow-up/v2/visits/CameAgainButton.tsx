"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CalendarPlus } from "lucide-react";
import FormModal from "@/components/ui/overlay/FormModal";
import { useCameAgain, useFirstTimerVisits } from "@/lib/api/first-timer-visits";
import { daysAgo, visitDayError } from "@/lib/first-timer/visit-day";
import { shortDate } from "../status";
import { VisitDayField } from "./VisitDayField";

const errorText = (err: unknown) => (err as { message?: string })?.message || "The visit could not be saved. Try again.";

/**
 * "Came again": records a return visit on the day picked, which starts on the
 * latest service held. The same day twice is one visit, so a double tap is safe.
 */
export function CameAgainButton({
  visitorId,
  firstName,
  firstVisitDate,
  className,
}: {
  visitorId: string;
  firstName: string;
  /** Read from their visits when the caller doesn't have it. */
  firstVisitDate?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState("");
  const visits = useFirstTimerVisits(visitorId, open);
  const cameAgain = useCameAgain(visitorId);
  const first = firstVisitDate ?? visits.data?.firstVisitDate ?? "";
  const day = picked || visits.data?.latestServiceDate || "";
  const error = day ? (visitDayError(day) ?? (first && day < first ? `That is before their first visit on ${shortDate(first)}` : null)) : null;

  function close() {
    setOpen(false);
    setPicked("");
  }

  async function save() {
    if (!day || error) return;
    try {
      const result = await cameAgain.mutateAsync(day);
      toast.success(
        result.added ? `${firstName} came again on ${shortDate(result.date)}` : `${firstName} already has a visit on ${shortDate(result.date)}`,
      );
      close();
    } catch (err) {
      toast.error(errorText(err));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/[0.06]"
        }
      >
        <CalendarPlus size={14} aria-hidden="true" /> Came again
      </button>
      <FormModal
        open={open}
        onClose={close}
        title={`${firstName} came again`}
        subtitle="Two services on one day count as one visit."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-white/65 dark:hover:bg-white/[0.06]">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!day || !!error || cameAgain.isPending}
              className="rounded-lg bg-[#87102C] px-4 py-2 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cameAgain.isPending ? "Saving..." : "Record visit"}
            </button>
          </div>
        }
      >
        {visits.isLoading && !picked ? (
          <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading the latest service" />
        ) : (
          <VisitDayField label="Which day did they come?" value={day} onChange={setPicked} min={daysAgo(14)} error={error} />
        )}
      </FormModal>
    </>
  );
}
