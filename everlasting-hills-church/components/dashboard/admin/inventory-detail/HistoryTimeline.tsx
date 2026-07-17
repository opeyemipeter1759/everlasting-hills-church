import { Package, Wrench } from "lucide-react";
import type { InventoryHistoryEntry, RepairStatus } from "../inventory/types";
import { formatDate, formatNaira } from "../inventory/helpers";

const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const REPAIR_STATUS_TONE: Record<RepairStatus, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  IN_PROGRESS: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
  COMPLETED: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

function TimelineEntry({ entry, isLast }: { entry: InventoryHistoryEntry; isLast: boolean }) {
  const isRepair = entry.type === "REPAIR";
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
            isRepair ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]"
          }`}
        >
          {isRepair ? <Wrench size={14} /> : <Package size={14} />}
        </span>
        {!isLast && <span className="w-px flex-1 bg-gray-200 dark:bg-white/10 mt-1" />}
      </div>

      <div className="pb-6 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{isRepair ? "Repair" : "Purchased"}</p>
          {entry.repairStatus && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${REPAIR_STATUS_TONE[entry.repairStatus]}`}>
              {REPAIR_STATUS_LABEL[entry.repairStatus]}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.occurredAt)}</span>
        </div>
        {entry.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{entry.description}</p>}
        {entry.resolution && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Fix: </span>
            {entry.resolution}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {entry.cost != null && <span className="font-semibold text-[#87102C] dark:text-[#e8768a]">{formatNaira(entry.cost)}</span>}
          {entry.performedBy && <span>by {entry.performedBy}</span>}
        </div>
      </div>
    </div>
  );
}

export default function HistoryTimeline({ history }: { history: InventoryHistoryEntry[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
        History timeline
      </p>
      {history.map((entry, i) => (
        <TimelineEntry key={entry.id} entry={entry} isLast={i === history.length - 1} />
      ))}
    </div>
  );
}
