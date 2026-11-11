import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BoardRow } from "@/lib/api/service-readiness-plans";
import StateChip from "./StateChip";
import { ResultChip } from "./ResultChip";
import ApproveButton from "./ApproveButton";
import UpdatesTimeline from "./UpdatesTimeline";
import { lagosWhen } from "./when";

const FIELDS = [
  ["support", "Support needed"],
  ["outstanding", "Still outstanding"],
  ["challenges", "Anticipated challenges"],
  ["workers", "Workers"],
  ["equipment", "Equipment & materials"],
  ["done", "Already done"],
] as const;

/** One unit on the board; opens to show its plan and updates. A submitted plan can be approved here. */
export default function BoardRowItem({ row, serviceId }: { row: BoardRow; serviceId: string }) {
  const [open, setOpen] = useState(false);
  const submitted = row.state !== "NOT_STARTED";
  const summary = !submitted
    ? (row.department ?? "No plan yet")
    : row.approvedAt
      ? `Approved by ${row.approvedBy ?? "the Administrator"} · ${lagosWhen(row.approvedAt)}`
      : `Submitted by ${row.confirmedBy ?? "the unit"} · ${lagosWhen(row.confirmedAt)}`;
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => submitted && setOpen((v) => !v)} aria-expanded={open} disabled={!submitted} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#111] dark:text-white">{row.unitName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-white/45">{summary}</p>
            {row.status === "BLOCKED" && row.blocker && <p className="truncate text-xs font-semibold text-red-700 dark:text-red-300">Blocker: {row.blocker}</p>}
          </div>
          <span className="hidden gap-1 sm:flex">
            <ResultChip label="Day before" result={row.inspections.DAY_BEFORE} />
            <ResultChip label="2h before" result={row.inspections.ON_THE_DAY} />
          </span>
          <StateChip plan={row} overdue={row.overdue} />
          {submitted && <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />}
        </button>
        {submitted && !row.approvedAt && <ApproveButton serviceId={serviceId} unitId={row.unitId} unitName={row.unitName} />}
      </div>
      {open && (
        <div className="mt-3 grid gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {FIELDS.filter(([key]) => row[key]).map(([key, label]) => (
              <div key={key} className="min-w-0">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">{label}</dt>
                <dd className="whitespace-pre-wrap break-words text-gray-800 dark:text-white/80">{row[key]}</dd>
              </div>
            ))}
          </dl>
          <UpdatesTimeline updates={row.updates} />
        </div>
      )}
    </li>
  );
}
