import { Check, X } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ReadinessTask } from "@/lib/api/service-readiness-plans";
import { useRemoveReadinessTask, useToggleReadinessTask } from "@/lib/api/service-readiness-tasks";

interface Props {
  tasks: ReadinessTask[];
  serviceId: string;
  unitId: string;
  /** The Church Administrator can also remove tasks the Administrator added. */
  asAdministrator?: boolean;
}

const failed = (err: unknown) => showToast.error((err as { message?: string }).message ?? "Couldn't save that. Please try again.");

/** A unit's tasks for a service: tap the circle to tick one off. */
export default function TaskList({ tasks, serviceId, unitId, asAdministrator = false }: Props) {
  const toggle = useToggleReadinessTask();
  const remove = useRemoveReadinessTask();
  const where = { serviceId, unitId };

  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {tasks.map((t) => (
        <li key={t.id} className="group flex items-center gap-3 py-2.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={t.done}
            aria-label={t.title}
            onClick={() => toggle.mutate({ ...where, taskId: t.id, done: !t.done }, { onError: failed })}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              t.done
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300 text-transparent hover:border-[#87102C] dark:border-white/25"
            }`}
          >
            <Check size={14} strokeWidth={3} aria-hidden="true" />
          </button>
          <span className={`min-w-0 flex-1 break-words text-sm ${t.done ? "text-gray-400 line-through dark:text-white/35" : "text-gray-800 dark:text-white/85"}`}>
            {t.title}
          </span>
          {t.byAdministrator && (
            <span className="shrink-0 rounded-full bg-[#87102C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]">
              Admin
            </span>
          )}
          {(!t.byAdministrator || asAdministrator) && (
            <button
              type="button"
              aria-label={`Remove “${t.title}”`}
              onClick={() => remove.mutate({ ...where, taskId: t.id }, { onError: failed })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 dark:text-white/30 dark:hover:bg-white/10"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
