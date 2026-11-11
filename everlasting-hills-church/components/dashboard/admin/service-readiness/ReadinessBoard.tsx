"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useReadinessBoard, type BoardRow } from "@/lib/api/service-readiness-plans";
import BoardRowItem from "./BoardRowItem";
import { lagosTime, lagosWhen } from "./when";

/** Stage 1 for the next (or the following) service: every unit, who has submitted and who hasn't, worst first. */
export default function ReadinessBoard() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useReadinessBoard(serviceId);

  if (isLoading) return <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>;
  if (isError || !data) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm dark:border-red-900 dark:text-white/75">
        The readiness board could not load. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
      </div>
    );
  }
  const selected = data.services.find((s) => s.id === data.selectedId);
  if (!selected) return <p className="text-sm text-gray-500 dark:text-white/50">No Sunday or Wednesday service is coming up.</p>;

  const rows = data.rows;
  const count = (pred: (r: BoardRow) => boolean) => rows.filter(pred).length;
  const submitted = (r: BoardRow) => r.state !== "NOT_STARTED";
  const tally = [
    ["Not submitted", count((r) => !submitted(r))],
    ["Awaiting approval", count((r) => submitted(r) && !r.approvedAt)],
    ["Approved", count((r) => !!r.approvedAt)],
    ["Blocked", count((r) => submitted(r) && r.status === "BLOCKED")],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Service">
        {data.services.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === selected.id}
            onClick={() => setServiceId(s.id)}
            className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${s.id === selected.id ? "border-transparent bg-[#87102C] text-white" : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-white/65"}`}
          >
            {s.serviceType === "SUNDAY" ? "Sunday" : "Wednesday"} · {lagosWhen(s.readyBy).split(",")[0]}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-white/60">
        Plans due <b>{lagosWhen(selected.planDue)}</b> · inspections <b>{lagosWhen(selected.inspections?.DAY_BEFORE ?? null)}</b> and{" "}
        <b>{lagosWhen(selected.inspections?.ON_THE_DAY ?? null)}</b> · ready by <b>{lagosTime(selected.readyBy)}</b>
      </p>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tally.map(([label, n]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
            <dt className="text-xs text-gray-500 dark:text-white/45">{label}</dt>
            <dd className="text-xl font-black tabular-nums text-[#111] dark:text-white">{n}</dd>
          </div>
        ))}
      </dl>
      {data.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
          There are no units yet. Add units under Service Teams.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-white/[0.06] dark:border-white/10 dark:bg-white/[0.02]">
          {data.rows.map((r) => <BoardRowItem key={r.unitId} row={r} serviceId={selected.id} />)}
        </ul>
      )}
    </div>
  );
}
