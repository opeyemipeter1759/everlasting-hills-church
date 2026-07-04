"use client";

import { useState } from "react";
import { ClipboardList, Plus, Check } from "lucide-react";
import PeopleModal from "@/components/dashboard/admin/people/PeopleModal";
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
  const [justSaved, setJustSaved] = useState(false);

  const byDate = useHeadcountByDate(date);
  const save = useSaveHeadcountByDate(date);

  const hc = byDate.data?.headcount ?? null;
  const canRecord = byDate.data?.canRecord ?? false;
  const selectedType = byDate.data?.inferredType ?? inferType(date);

  // Picking a day pops the form modal open (per the flow).
  function pickDate(d: string) {
    setDate(d);
    setJustSaved(false);
    setModalOpen(true);
  }

  async function submit(input: SaveHeadcountInput) {
    await save.mutateAsync(input);
    await byDate.refetch();
    setModalOpen(false);
    setJustSaved(true);
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

        {justSaved && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={15} /> Attendance saved for {prettyDate(date)}.
          </p>
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
            onClick={() => { setJustSaved(false); setModalOpen(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5"
          >
            <Plus size={16} /> {hc ? "Edit attendance" : "Record attendance"}
          </button>
        </div>
      </div>

      {/* Modal form */}
      <PeopleModal
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
            disabledReason={!canRecord ? "You can only record a headcount for a date that has already occurred." : undefined}
            pending={save.isPending}
            onSubmit={(input) => submit(input)}
          />
        )}
      </PeopleModal>
    </div>
  );
}
