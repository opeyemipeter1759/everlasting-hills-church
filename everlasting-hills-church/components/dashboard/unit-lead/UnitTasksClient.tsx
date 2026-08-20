"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CircleDot, Plus, Trash2 } from "lucide-react";
import { useUnitLeadContext } from "./useUnitLeadContext";
import { useUnitTasks, useCreateUnitTask, useUpdateUnitTask, useDeleteUnitTask } from "@/lib/api";
import type { UnitTaskStatus } from "@/types";
import UnitLeadTabs from "./UnitLeadTabs";
import SubmitButton from "@/components/ui/form/SubmitButton";
import TaskCommentThread from "@/components/dashboard/units/TaskCommentThread";

const STATUS_LABEL: Record<UnitTaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const STATUS_ICON: Record<UnitTaskStatus, typeof Circle> = {
  TODO: Circle,
  IN_PROGRESS: CircleDot,
  DONE: CheckCircle2,
};

export default function UnitTasksClient({ unitId }: { unitId: string }) {
  const { summary, unit } = useUnitLeadContext(unitId);
  const { data: tasks } = useUnitTasks(unitId);
  const create = useCreateUnitTask();
  const update = useUpdateUnitTask();
  const del = useDeleteUnitTask();

  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (summary === undefined) return null;
  if (!summary) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    try {
      await create.mutateAsync({
        unitId,
        title: title.trim(),
        assignedToId: assignedToId || undefined,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setAssignedToId("");
      setDueDate("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't create task");
    }
  }

  function cycleStatus(taskId: string, current: UnitTaskStatus) {
    const next: UnitTaskStatus = current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
    update.mutate({ unitId, taskId, status: next });
  }

  return (
    <div className="space-y-5 mx-auto max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{summary.name}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Assign tasks to members of this unit, or leave unassigned for the whole unit.
        </p>
      </div>

      <UnitLeadTabs unitId={unitId} active="tasks" />

      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Tasks {tasks ? `(${tasks.length})` : ""}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              maxLength={140}
              className="sm:col-span-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            >
              <option value="">Whole unit</option>
              {unit?.UnitMember.map((m) => (
                <option key={m.memberId} value={m.memberId}>
                  {m.Member.firstName} {m.Member.lastName}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
              />
              <SubmitButton loading={create.isPending} disabled={!title.trim()} className="px-3 py-2 flex-shrink-0">
                <Plus size={13} />
              </SubmitButton>
            </div>
          </form>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
              {error}
            </p>
          )}

          {tasks && tasks.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No tasks yet. Add one above.
            </p>
          )}

          {tasks && tasks.length > 0 && (
            <ul className="space-y-2">
              {tasks.map((t) => {
                const StatusIcon = STATUS_ICON[t.status];
                return (
                  <li
                    key={t.id}
                    className="px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => cycleStatus(t.id, t.status)}
                        title={`Mark as ${STATUS_LABEL[t.status === "TODO" ? "IN_PROGRESS" : t.status === "IN_PROGRESS" ? "DONE" : "TODO"]}`}
                        className={`flex-shrink-0 ${t.status === "DONE" ? "text-emerald-500" : "text-gray-400 hover:text-[#87102C]"}`}
                      >
                        <StatusIcon size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${t.status === "DONE" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                          {t.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {t.AssignedTo ? `${t.AssignedTo.firstName} ${t.AssignedTo.lastName}` : "Whole unit"}
                          {t.dueDate && ` · Due ${new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {STATUS_LABEL[t.status]}
                      </span>
                      <button
                        type="button"
                        onClick={() => del.mutate({ unitId, taskId: t.id })}
                        title="Delete task"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="mt-2 pl-7">
                      <TaskCommentThread unitId={unitId} taskId={t.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
