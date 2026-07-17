import { CONDITION_LABEL, STATUS_LABEL, type InventoryCondition, type InventoryStatus } from "./types";

const STATUS_TONE: Record<InventoryStatus, string> = {
  IN_USE: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  IN_STORAGE: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
  UNDER_REPAIR: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  RETIRED: "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400",
};

const CONDITION_TONE: Record<InventoryCondition, string> = {
  NEW: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
  GOOD: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  FAIR: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  POOR: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
};

export function StatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: InventoryCondition }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${CONDITION_TONE[condition]}`}
    >
      {CONDITION_LABEL[condition]}
    </span>
  );
}
