import { Copy } from "lucide-react";
import type { MyReadinessItem } from "@/lib/api/service-readiness-plans";
import { useAddReadinessTasks } from "@/lib/api/service-readiness-tasks";
import StateChip from "@/components/dashboard/admin/service-readiness/StateChip";
import { lagosTime, lagosWhen } from "@/components/dashboard/admin/service-readiness/when";
import TaskList from "./tasks/TaskList";
import AddTaskInput from "./tasks/AddTaskInput";
import TaskProgress from "./tasks/TaskProgress";
import PlanActions from "./PlanActions";

/** One unit's plan for one service: its tasks, then sending it and posting updates. */
export default function UnitPlanCard({ item }: { item: MyReadinessItem }) {
  const copy = useAddReadinessTasks();
  const { service, unit, plan, previous } = item;
  const notSent = plan.state === "NOT_STARTED";
  const overdue = notSent && !!service.planDue && Date.now() > Date.parse(service.planDue);
  const day = service.serviceType === "SUNDAY" ? "Sunday" : "Wednesday";
  const where = { serviceId: service.id, unitId: unit.id };

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <header className="flex items-start gap-3 border-b border-gray-100 px-5 pb-4 pt-5 dark:border-white/[0.06]">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-black tracking-tight text-[#111] dark:text-white">{unit.name}</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/45">
            Plan due {lagosWhen(service.planDue)} · ready by {lagosTime(service.readyBy)}
          </p>
        </div>
        <StateChip plan={plan} overdue={overdue} />
      </header>

      <div className="space-y-4 px-5 py-4">
        {plan.tasks.length > 0 && <TaskProgress tasks={plan.tasks} />}
        {plan.tasks.length ? (
          <TaskList tasks={plan.tasks} {...where} />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center dark:border-white/10">
            <p className="text-sm font-semibold text-gray-700 dark:text-white/75">What does {unit.name} need to get done for {day}?</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/45">Add each task below. You&apos;ll tick them off as you go.</p>
            {previous && (
              <button
                type="button"
                disabled={copy.isPending}
                onClick={() => copy.mutate({ ...where, titles: previous })}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#87102C]/10 px-3 py-1.5 text-xs font-bold text-[#87102C] hover:bg-[#87102C]/15 disabled:opacity-50 dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]"
              >
                <Copy size={13} aria-hidden="true" /> Copy last {day}&apos;s {previous.length} task{previous.length === 1 ? "" : "s"}
              </button>
            )}
          </div>
        )}
        <AddTaskInput {...where} />
      </div>

      <PlanActions item={item} />
    </article>
  );
}
