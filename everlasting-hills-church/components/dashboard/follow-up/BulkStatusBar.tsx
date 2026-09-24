"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { MasterListRow, MasterListStatus } from "@/lib/api/follow-up-pipeline";
import { useBulkStatusChange } from "@/lib/api/follow-up-bulk";
import { Select } from "@/components/ui/select";
import { PILL, STATUS_OPTIONS } from "./filter-bits";

/**
 * What a leader does with the people they have ticked: put them all on the
 * same status in one action. It only appears once something is ticked, so it
 * never sits in the way of reading the table.
 */
export function BulkStatusBar({
  people,
  busyLabel,
  onDone,
  onClear,
}: {
  people: MasterListRow[];
  busyLabel?: string;
  onDone: () => void;
  onClear: () => void;
}) {
  const [toStatus, setToStatus] = useState<MasterListStatus | "">("");
  const change = useBulkStatusChange();

  if (people.length === 0) return null;

  function apply() {
    if (!toStatus) return;
    change.mutate(
      { people, toStatus: toStatus as MasterListStatus },
      {
        onSuccess: () => {
          setToStatus("");
          onDone();
        },
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#87102C]/20 bg-[#FFF4F6] p-2 dark:border-[#FFB3C1]/20 dark:bg-[#87102C]/15">
      <p className="px-1.5 text-sm font-semibold text-[#87102C] dark:text-[#FFB3C1]">
        {people.length} selected
      </p>

      <Select
        aria-label="Status to set for everyone selected"
        value={toStatus}
        onChange={(next) => setToStatus(next as MasterListStatus)}
        className={`${PILL} w-full sm:w-[13rem]`}
        prefixLabel="Set status:"
        placeholder="Choose one"
        options={STATUS_OPTIONS}
      />

      <button
        type="button"
        onClick={apply}
        disabled={!toStatus || change.isPending}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50"
      >
        {change.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
        {change.isPending ? busyLabel ?? "Applying…" : "Apply to all"}
      </button>

      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-10 items-center gap-1 rounded-xl px-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-white/70 dark:text-white/60 dark:hover:bg-white/10"
      >
        <X size={14} aria-hidden="true" />
        Clear
      </button>

      <p className="w-full px-1.5 text-xs text-gray-500 dark:text-white/45">
        Your change is final — it doesn&apos;t wait for anyone to approve it.
      </p>
    </div>
  );
}
