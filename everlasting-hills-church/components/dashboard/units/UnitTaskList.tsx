"use client";

import { ClipboardList, ListChecks } from "lucide-react";
import type { UnitTask, UnitTaskReport, UnitTaskStatus } from "@/types";
import SectionCard from "./SectionCard";
import TaskCommentThread from "./TaskCommentThread";
import TaskReportsPanel from "./TaskReportsPanel";
import { STATUS_LABEL, STATUS_ICON } from "./taskStatus";
import { OUTCOME_META, REPORT_STATUS_META } from "./taskReport";

/**
 * Renders a list of unit tasks, each with its discussion thread and reports.
 * When `onCycleStatus` is given the status icon becomes clickable (for a
 * member's own tasks). `onReport` adds a Report button to tasks the viewer
 * may report on — their own, and whole-unit ones.
 */
export default function UnitTaskList({
  unitId,
  title,
  tasks,
  delay,
  viewerMemberId,
  viewerProfileId,
  canReview = false,
  onCycleStatus,
  onReport,
  onEditReport,
}: {
  unitId: string;
  title: string;
  tasks: UnitTask[];
  delay?: number;
  viewerMemberId?: string | null;
  viewerProfileId?: string | null;
  canReview?: boolean;
  onCycleStatus?: (taskId: string, current: UnitTaskStatus) => void;
  onReport?: (task: UnitTask) => void;
  onEditReport?: (task: UnitTask, report: UnitTaskReport) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <SectionCard icon={ListChecks} title={title} count={tasks.length} delay={delay}>
      <ul className="space-y-2">
        {tasks.map((t) => {
          const StatusIcon = STATUS_ICON[t.status];
          const mayReport = !!onReport && (t.assignedToId === null || t.assignedToId === viewerMemberId);
          const latest = t.latestReport;
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
                {mayReport && (
                  <button
                    type="button"
                    onClick={() => onReport!(t)}
                    title="Send a report on this task to your unit lead"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#6E0C24] transition-colors flex-shrink-0"
                  >
                    <ClipboardList size={12} />
                    Report
                  </button>
                )}
              </div>

              {latest && (
                <p className="mt-1.5 pl-7 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 dark:text-white/40">
                  <span className="font-semibold uppercase tracking-wider">Latest report</span>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-bold ${OUTCOME_META[latest.outcome].cls}`}>
                    {OUTCOME_META[latest.outcome].label}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-bold ${REPORT_STATUS_META[latest.status].cls}`}>
                    {REPORT_STATUS_META[latest.status].label}
                  </span>
                </p>
              )}

              <div className="mt-2 pl-7 flex flex-wrap items-start gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1 basis-64">
                  <TaskCommentThread unitId={unitId} taskId={t.id} commentCount={t._count?.Comments ?? 0} />
                </div>
                <div className="min-w-0 flex-1 basis-64">
                  <TaskReportsPanel
                    unitId={unitId}
                    taskId={t.id}
                    reportCount={t._count?.Reports ?? 0}
                    canReview={canReview}
                    viewerProfileId={viewerProfileId ?? null}
                    onEdit={onEditReport ? (r) => onEditReport(t, r) : undefined}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
