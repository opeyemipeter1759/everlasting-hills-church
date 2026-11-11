import type { ReadinessPlan } from "@/lib/api/service-readiness-plans";

const RED = "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
const AMBER = "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
const GREY = "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60";
const GREEN = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";

type ChipPlan = Pick<ReadinessPlan, "state" | "status" | "approvedAt">;

/** Where a unit's plan stands, most urgent first: overdue, not submitted, blocked, awaiting approval, approved. */
export function planLabel(plan: ChipPlan, overdue = false): [string, string] {
  if (overdue) return ["Overdue", RED];
  if (plan.state === "NOT_STARTED") return ["Not submitted", GREY];
  if (plan.status === "BLOCKED") return ["Blocked", RED];
  if (!plan.approvedAt) return ["Awaiting approval", AMBER];
  return [plan.status === "READY" ? "Approved · Ready" : "Approved", GREEN];
}

export default function StateChip({ plan, overdue = false }: { plan: ChipPlan; overdue?: boolean }) {
  const [label, cls] = planLabel(plan, overdue);
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{label}</span>;
}
