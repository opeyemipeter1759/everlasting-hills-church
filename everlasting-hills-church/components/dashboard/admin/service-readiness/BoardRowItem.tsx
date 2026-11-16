import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import type { BoardRow } from "@/lib/api/service-readiness-plans";
import TaskList from "@/components/dashboard/service-readiness/tasks/TaskList";
import AddTaskInput from "@/components/dashboard/service-readiness/tasks/AddTaskInput";
import TaskProgress from "@/components/dashboard/service-readiness/tasks/TaskProgress";
import StateChip from "./StateChip";
import ApproveButton from "./ApproveButton";
import UpdatesTimeline from "./UpdatesTimeline";
import { lagosWhen } from "./when";

/** One unit on the board. Opens to its task list, where the Administrator can add tasks of their own. */
export default function BoardRowItem({ row, serviceId }: { row: BoardRow; serviceId: string }) {
  const [open, setOpen] = useState(false);
  const sent = row.state !== "NOT_STARTED";
  const summary = !sent
    ? (row.department ?? "Plan not sent yet")
    : row.approvedAt
      ? `Approved by ${row.approvedBy ?? "the Administrator"} · ${lagosWhen(row.approvedAt)}`
      : `Sent by ${row.confirmedBy ?? "the unit"} · ${lagosWhen(row.confirmedAt)}`;

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#111] dark:text-white">{row.unitName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-white/45">{summary}</p>
          </div>
          <span className="hidden sm:block"><TaskProgress tasks={row.tasks} compact /></span>
          <StateChip plan={row} overdue={row.overdue} />
          <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {sent && !row.approvedAt && <ApproveButton serviceId={serviceId} unitId={row.unitId} unitName={row.unitName} />}
      </div>

      {open && (
        <div className="space-y-4 border-t border-gray-100 bg-gray-50/70 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
          {row.status === "BLOCKED" && row.blocker && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {row.blocker}
            </p>
          )}
          {row.tasks.length > 0 ? (
            <div className="rounded-2xl bg-white px-4 dark:bg-white/[0.03]">
              <TaskList tasks={row.tasks} serviceId={serviceId} unitId={row.unitId} asAdministrator />
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-white/50">{row.unitName} hasn&apos;t added any tasks yet.</p>
          )}
          <AddTaskInput serviceId={serviceId} unitId={row.unitId} placeholder={`Add a task for ${row.unitName}`} />
          <p className="text-xs text-gray-400 dark:text-white/35">The unit&apos;s leaders are emailed when you add a task.</p>
          <UpdatesTimeline updates={row.updates} />
        </div>
      )}
    </li>
  );
}
