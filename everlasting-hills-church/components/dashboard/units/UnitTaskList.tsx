"use client";

import { ListChecks } from "lucide-react";
import type { UnitTask, UnitTaskStatus } from "@/types";
import SectionCard from "./SectionCard";
import TaskCommentThread from "./TaskCommentThread";
import { STATUS_LABEL, STATUS_ICON } from "./taskStatus";

/** Renders a list of unit tasks with a comment thread under each. When
 * `onCycleStatus` is given the status icon becomes clickable (for a member's
 * own tasks); otherwise it's a static read-only indicator. */
export default function UnitTaskList({
  unitId,
  title,
  tasks,
  delay,
  onCycleStatus,
}: {
  unitId: string;
  title: string;
  tasks: UnitTask[];
  delay?: number;
  onCycleStatus?: (taskId: string, current: UnitTaskStatus) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <SectionCard icon={ListChecks} title={title} count={tasks.length} delay={delay}>
      <ul className="space-y-2">
        {tasks.map((t) => {
          const StatusIcon = STATUS_ICON[t.status];
          return (
            <li
              key={t.id}
              className="px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                {onCycleStatus ? (
                  <button
                    type="button"
                    onClick={() => onCycleStatus(t.id, t.status)}
                    title={`Mark as ${STATUS_LABEL[t.status === "TODO" ? "IN_PROGRESS" : t.status === "IN_PROGRESS" ? "DONE" : "TODO"]}`}
                    className={`flex-shrink-0 transition-colors ${t.status === "DONE" ? "text-emerald-500" : "text-gray-300 hover:text-[#87102C] dark:text-gray-600"}`}
                  >
                    <StatusIcon size={19} />
                  </button>
                ) : (
                  <StatusIcon size={15} className={t.status === "DONE" ? "text-emerald-500 flex-shrink-0" : "text-gray-300 dark:text-gray-600 flex-shrink-0"} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${t.status === "DONE" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                    {t.title}
                  </p>
                  {(() => {
                    const subtitle = onCycleStatus
                      ? t.description
                      : t.AssignedTo
                        ? `${t.AssignedTo.firstName} ${t.AssignedTo.lastName}`
                        : "Whole unit";
                    return subtitle ? (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                    ) : null;
                  })()}
                </div>
                {t.dueDate && onCycleStatus && (
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                    Due {new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                )}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                    t.status === "DONE"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : t.status === "IN_PROGRESS"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        : "bg-gray-500/10 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
              <div className="mt-2 pl-7">
                <TaskCommentThread unitId={unitId} taskId={t.id} />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
