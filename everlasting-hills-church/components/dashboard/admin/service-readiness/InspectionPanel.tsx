"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useReadinessBoard, type InspectionRound } from "@/lib/api/service-readiness-plans";
import { useInspectionSheet } from "@/lib/api/service-readiness-inspections";
import InspectionCard from "./InspectionCard";
import { lagosWhen } from "./when";

const ROUNDS: { value: InspectionRound; label: string }[] = [
  { value: "DAY_BEFORE", label: "Day before" },
  { value: "ON_THE_DAY", label: "2 hours before" },
];

/** Stage 2: pick a coming service and a round, then inspect each serving department. */
export default function InspectionPanel() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [round, setRound] = useState<InspectionRound>("DAY_BEFORE");
  const board = useReadinessBoard(null);
  const services = board.data?.services ?? [];
  const chosen = services.find((s) => s.id === serviceId) ?? services[0] ?? null;
  const sheet = useInspectionSheet(chosen?.id ?? null, round);

  const chip = (on: boolean) =>
    `min-h-9 rounded-full border px-3 text-xs font-semibold ${on ? "border-transparent bg-[#87102C] text-white" : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-white/65"}`;

  if (board.isLoading) return <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>;
  if (!chosen) return <p className="text-sm text-gray-500 dark:text-white/50">No Sunday or Wednesday service is coming up.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Service">
        {services.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === chosen.id} onClick={() => setServiceId(s.id)} className={chip(s.id === chosen.id)}>
            {s.serviceType === "SUNDAY" ? "Sunday" : "Wednesday"} · {lagosWhen(s.readyBy).split(",")[0]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Inspection">
        {ROUNDS.map((r) => (
          <button key={r.value} type="button" aria-pressed={round === r.value} onClick={() => setRound(r.value)} className={chip(round === r.value)}>
            {r.label} · {lagosWhen(chosen.inspections?.[r.value] ?? null)}
          </button>
        ))}
      </div>
      {round === "DAY_BEFORE" && (
        <p className="text-xs text-gray-500 dark:text-white/50">The day before, each department&apos;s plan is shown beside its checklist.</p>
      )}
      {sheet.isLoading ? (
        <div className="flex justify-center py-10 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
      ) : sheet.isError || !sheet.data ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-4 text-sm dark:border-red-900 dark:text-white/75">
          The inspection could not load. <button type="button" onClick={() => sheet.refetch()} className="font-semibold underline">Try again</button>
        </div>
      ) : sheet.data.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
          No department is set to serve on this day yet. Choose them under Setup.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {sheet.data.rows.map((row) => (
            <InspectionCard key={`${row.unitId}-${round}-${row.inspection?.inspectedAt ?? "new"}`} row={row} serviceId={chosen.id} round={round} />
          ))}
        </ul>
      )}
    </div>
  );
}
