"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useReadinessBoard, type BoardRow } from "@/lib/api/service-readiness-plans";
import ServiceTabs from "@/components/dashboard/service-readiness/tasks/ServiceTabs";
import BoardRowItem from "./BoardRowItem";
import { lagosTime, lagosWhen } from "./when";

const sent = (r: BoardRow) => r.state !== "NOT_STARTED";
const FILTERS = [
  { key: "missing", label: "Not sent", dot: "bg-gray-400", test: (r: BoardRow) => !sent(r) },
  { key: "waiting", label: "Awaiting approval", dot: "bg-amber-500", test: (r: BoardRow) => sent(r) && !r.approvedAt },
  { key: "approved", label: "Approved", dot: "bg-emerald-500", test: (r: BoardRow) => !!r.approvedAt },
  { key: "blocked", label: "Blocked", dot: "bg-red-500", test: (r: BoardRow) => sent(r) && r.status === "BLOCKED" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

/** Every unit's plan for the next (or the following) service. Tap a count to see just those units. */
export default function ReadinessBoard() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey | null>(null);
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

  const active = FILTERS.find((f) => f.key === filter);
  const rows = active ? data.rows.filter(active.test) : data.rows;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ServiceTabs services={data.services} selectedId={selected.id} onSelect={(id) => { setServiceId(id); setFilter(null); }} />
        <p className="text-xs text-gray-500 dark:text-white/50">
          Plans due <b>{lagosWhen(selected.planDue)}</b> · ready by <b>{lagosTime(selected.readyBy)}</b>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Show units">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on ? null : f.key)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                on ? "border-[#87102C] bg-[#87102C]/[0.04] dark:border-[#FFB3C1] dark:bg-[#FFB3C1]/10" : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03]"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/50">
                <span className={`h-2 w-2 rounded-full ${f.dot}`} aria-hidden="true" /> {f.label}
              </span>
              <span className="mt-1 block text-2xl font-black tabular-nums text-[#111] dark:text-white">{data.rows.filter(f.test).length}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
          {active ? `No units are ${active.label.toLowerCase()}.` : "There are no units yet. Add units under Service Teams."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:divide-white/[0.06] dark:border-white/10 dark:bg-white/[0.02]">
          {rows.map((r) => <BoardRowItem key={r.unitId} row={r} serviceId={selected.id} />)}
        </ul>
      )}
    </div>
  );
}
