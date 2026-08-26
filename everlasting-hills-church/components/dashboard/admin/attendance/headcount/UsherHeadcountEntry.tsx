"use client";

import { useState } from "react";
import { ClipboardList, Plus, Check, Save } from "lucide-react";
import FormModal from "@/components/ui/overlay/FormModal";
import {
  useHeadcountByDate,
  useSaveHeadcountByDate,
  type SaveHeadcountInput,
} from "@/lib/api/headcount";
import HeadcountDatePicker from "./HeadcountDatePicker";
import HeadcountReportCard from "./HeadcountReportCard";
import HeadcountEntryForm from "./HeadcountEntryForm";
import { watTodayStr, prettyDate, inferType } from "./date-utils";

export default function UsherHeadcountEntry() {
  const [date, setDate] = useState<string>(watTodayStr());
  const [modalOpen, setModalOpen] = useState(false);
  // What the last save produced, so the confirmation message can say whether the
  // count is actually counted — a draft looks saved but is excluded from every
  // attendance report, which is not something to leave an usher guessing at.
  const [justSaved, setJustSaved] = useState<"CONFIRMED" | "DRAFT" | null>(null);

  const byDate = useHeadcountByDate(date);
  const save = useSaveHeadcountByDate(date);

  const hc = byDate.data?.headcount ?? null;
  const canRecord = byDate.data?.canRecord ?? false;
  const selectedType = byDate.data?.inferredType ?? inferType(date);

  // A failed request and a date the server refuses are different problems, and
  // both used to render as "You can only record a headcount for a date that has
  // already occurred" — which is misleading when the truth is a 403, a network
  // error, or a server whose clock says it is still yesterday.
  const loadError = byDate.isError ? ((byDate.error as { message?: string })?.message ?? "Could not load this date.") : null;
  const serverDate = byDate.data?.serverDate;
  const disabledReason = loadError
    ? `Could not load the service for this date — ${loadError}`
    : serverDate && serverDate < date
      ? `The server's current date is ${prettyDate(serverDate)}, so ${prettyDate(date)} is still in the future. If that date looks wrong, check ATTENDANCE_TEST_NOW and the server clock.`
      : "You can only record a headcount for a date that has already occurred.";

  // Picking a day pops the form modal open (per the flow).
  function pickDate(d: string) {
    setDate(d);
    setJustSaved(null);
    setModalOpen(true);
  }

  async function submit(input: SaveHeadcountInput) {
    await save.mutateAsync(input);
    await byDate.refetch();
    setModalOpen(false);
    setJustSaved(input.confirm ? "CONFIRMED" : "DRAFT");
  }

  /** Promotes an existing draft without reopening the form and retyping it. */
  async function confirmExisting() {
    if (!hc) return;
    await submit({
      men: hc.men,
      women: hc.women,
      boys: hc.boys,
      girls: hc.girls,
      firstTimers: hc.firstTimers,
      reportedTotal: hc.reportedTotal,
      notes: hc.notes,
      confirm: true,
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
          <ClipboardList size={16} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Usher — Record Attendance</h1>
          <p className="mt-0.5 max-w-md text-xs text-gray-400 dark:text-gray-500">
            Pick the service date, then fill in the congregation headcount. This is the authoritative
            count of everyone present.
          </p>
        </div>
      </div>

      {/* Date picker */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <HeadcountDatePicker value={date} onChange={pickDate} />

        {justSaved === "CONFIRMED" && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={15} /> Attendance confirmed for {prettyDate(date)}.
          </p>
        )}
        {justSaved === "DRAFT" && (
          <p className="mt-4 inline-flex items-start gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Save size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              Saved as a draft for {prettyDate(date)} — drafts are left out of attendance reports until
              they are confirmed.
            </span>
          </p>
        )}

        {/* A draft that is already filled in only needs one click to count. */}
        {hc?.status === "DRAFT" && (
          <button
            type="button"
            onClick={confirmExisting}
            disabled={save.isPending}
            className="mt-4 ml-0 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
          >
            <Check size={15} /> {save.isPending ? "Confirming…" : "Confirm this count"}
          </button>
        )}

        {/* Current record for the selected date */}
        <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4">
          {byDate.isLoading ? (
            <div className="h-32 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ) : (
            <HeadcountReportCard
              hc={hc}
              serviceName={byDate.data?.service?.name ?? null}
              serviceType={selectedType}
              serviceDate={date}
              featured
            />
          )}

          <button
            type="button"
            onClick={() => { setJustSaved(null); setModalOpen(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            <Plus size={16} /> {hc ? "Edit attendance" : "Record attendance"}
          </button>
        </div>
      </div>

      {/* Modal form */}
      <FormModal
        open={modalOpen}
        title={`${hc ? "Edit" : "Record"} attendance`}
        subtitle={prettyDate(date)}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-lg"
      >
        {byDate.isLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        ) : (
          <HeadcountEntryForm
            existing={hc}
            canRecord={canRecord}
            disabledReason={!canRecord ? disabledReason : undefined}
            pending={save.isPending}
            onSubmit={(input) => submit(input)}
          />
        )}
      </FormModal>
    </div>
  );
}
