import type { ReadinessTask } from "@/lib/api/service-readiness-plans";

/** "3 of 5 done" with a bar that turns green when everything is ticked off. */
export default function TaskProgress({ tasks, compact = false }: { tasks: ReadinessTask[]; compact?: boolean }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  return (
    <div className={compact ? "w-24" : "w-full"}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-gray-600 dark:text-white/60">
          {total ? `${done} of ${total} done` : "No tasks yet"}
        </span>
        {!compact && total > 0 && <span className="tabular-nums text-gray-400 dark:text-white/40">{pct}%</span>}
      </div>
      <div
        role="progressbar"
        aria-label="Tasks done"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
      >
        <div className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-500" : "bg-[#87102C] dark:bg-[#FFB3C1]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
