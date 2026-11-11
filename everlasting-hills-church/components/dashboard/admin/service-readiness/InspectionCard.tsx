import { useState } from "react";
import { Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useSaveInspection, type InspectionRow } from "@/lib/api/service-readiness-inspections";
import type { InspectionRound } from "@/lib/api/service-readiness-plans";
import StateChip from "./StateChip";
import { ResultChip } from "./ResultChip";

/** One department at inspection: its plan (the day before), its checklist to tick, and a note. */
export default function InspectionCard({ row, serviceId, round }: { row: InspectionRow; serviceId: string; round: InspectionRound }) {
  const save = useSaveInspection(serviceId, round);
  const saved = row.inspection;
  const [ticked, setTicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(row.checklist.map((label) => [label, saved?.checks.find((c) => c.label === label)?.passed ?? false])),
  );
  const [note, setNote] = useState(saved?.note ?? "");
  const [ready, setReady] = useState(saved ? saved.result === "READY" : true);
  const id = (k: string) => `${row.unitId}-${round}-${k}`;

  function submit() {
    save.mutate(
      { unitId: row.unitId, checks: row.checklist.map((label) => ({ label, passed: !!ticked[label] })), note, ready },
      {
        onSuccess: (res) => showToast.success(`${row.unitName}: ${res.result === "READY" ? "ready" : "issues recorded"}`),
        onError: (err) => showToast.error((err as { message?: string }).message ?? `Couldn't save ${row.unitName}`),
      },
    );
  }

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-bold text-[#111] dark:text-white">{row.unitName}</p>
        {round === "DAY_BEFORE" && <StateChip plan={row} />}
        {saved && <ResultChip result={saved.result} />}
      </div>
      {round === "DAY_BEFORE" && (row.openTasks.length > 0 || row.planMissing || row.blocker) && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {row.planMissing ? "No plan submitted." : [row.blocker && `Blocker: ${row.blocker}`, row.openTasks.length > 0 && `Still to do: ${row.openTasks.join(", ")}`].filter(Boolean).join(" · ")}
        </p>
      )}
      {row.checklist.length ? (
        <ul className="mt-3 grid gap-1.5">
          {row.checklist.map((label, i) => (
            <li key={label}>
              <label htmlFor={id(`c${i}`)} className="flex min-h-10 items-center gap-2.5 text-sm text-gray-800 dark:text-white/85">
                <input id={id(`c${i}`)} type="checkbox" checked={!!ticked[label]} onChange={(e) => setTicked((t) => ({ ...t, [label]: e.target.checked }))} className="h-4 w-4 accent-[#87102C]" />
                {label}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <label className="mt-3 flex min-h-10 items-center gap-2.5 text-sm text-gray-800 dark:text-white/85">
          <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} className="h-4 w-4 accent-[#87102C]" />
          Ready (no checklist set for this department yet)
        </label>
      )}
      <textarea
        aria-label={`Note for ${row.unitName}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note (optional): what was missing, who is fixing it"
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#87102C]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
      <button type="button" onClick={submit} disabled={save.isPending} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-bold text-white hover:bg-[#6E0C24] disabled:opacity-60">
        {save.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {saved ? "Update inspection" : "Save inspection"}
      </button>
    </li>
  );
}
