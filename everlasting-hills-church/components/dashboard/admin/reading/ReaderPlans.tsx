import { X } from "lucide-react";
import type { Reader, ReaderPlan } from "@/lib/api/admin-reading";

/** A reader's plans as chips: progress, paused/done, and a remove button on plans still running. */
export default function ReaderPlans({ reader, onRemovePlan }: { reader: Reader; onRemovePlan: (plan: ReaderPlan) => void }) {
  if (reader.plans.length === 0) return <span className="text-xs text-gray-400 dark:text-white/40">No plan yet</span>;
  return (
    <>
      {reader.plans.map((plan, index) => {
        const percent = plan.durationDays ? Math.min(100, Math.round((plan.completedDays / plan.durationDays) * 100)) : 0;
        // A finished plan is history; only plans in progress or paused can be removed.
        const removable = Boolean(plan.subscriptionId) && plan.status !== "COMPLETED";
        return (
          <span
            key={plan.subscriptionId ?? `${plan.title}-${index}`}
            title={`${plan.title}: ${plan.completedDays} of ${plan.durationDays} days`}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-2.5 text-[11px] text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75 ${removable ? "pr-1" : "pr-2.5"}`}
          >
            <span className="truncate">{plan.title}</span>
            <span className="tabular-nums font-semibold text-[#87102C] dark:text-[#FFB3C1]">{percent}%</span>
            {plan.status === "PAUSED" && <span className="text-amber-700 dark:text-amber-300">paused</span>}
            {plan.status === "COMPLETED" && <span className="text-emerald-700 dark:text-emerald-400">done</span>}
            {removable && (
              <button
                type="button"
                onClick={() => onRemovePlan(plan)}
                aria-label={`Remove ${plan.title} from ${reader.name}`}
                title="Remove this plan"
                className="-my-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </span>
        );
      })}
    </>
  );
}
