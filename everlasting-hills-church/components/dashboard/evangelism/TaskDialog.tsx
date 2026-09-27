"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import {
  useCreateTask,
  useEvangelismTeam,
  useUpdateTask,
  type EvangelismTask,
  type TaskPriority,
  type TaskType,
} from "@/lib/api/evangelism";
import { primaryButton, secondaryButton, selectClass } from "./bits";
import { TASK_PRIORITY_LABEL, TASK_TYPE_LABEL, errorText, inputClass, labelClass } from "./labels";

/** A leader creates (or edits) a task and gives it to one or more people on the team. */
export function TaskDialog({
  open,
  onClose,
  task,
  contact,
  defaultAssigneeId,
}: {
  open: boolean;
  onClose: () => void;
  task?: EvangelismTask | null;
  contact?: { id: string; name: string } | null;
  defaultAssigneeId?: string | null;
}) {
  const team = useEvangelismTeam(open);
  const create = useCreateTask();
  const update = useUpdateTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("CALL");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [due, setDue] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const linked = task?.contact ?? contact ?? null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(task?.title ?? (contact ? `Follow up with ${contact.name}` : ""));
    setDescription(task?.description ?? "");
    setType(task?.type ?? "CALL");
    setPriority(task?.priority ?? "MEDIUM");
    setDue(task?.dueAt ? new Date(new Date(task.dueAt).getTime() + 3_600_000).toISOString().slice(0, 10) : "");
    setAssignees(task ? task.assignees.map((a) => a.id) : defaultAssigneeId ? [defaultAssigneeId] : []);
  }, [open, task, contact, defaultAssigneeId]);

  const toggle = (id: string) => setAssignees((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const members = team.data ?? [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Give the task a title.");
    const onTeam = assignees.filter((id) => members.some((m) => m.id === id));
    if (onTeam.length === 0) return setError("Choose at least one person.");
    const dueAt = due ? new Date(`${due}T18:00:00+01:00`).toISOString() : undefined;
    try {
      if (task) {
        await update.mutateAsync({
          id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          type,
          priority,
          dueAt: dueAt ?? null,
          assigneeIds: onTeam,
        });
        showToast.success("Task updated");
      } else {
        await create.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          dueAt,
          contactId: linked?.id,
          assigneeIds: onTeam,
        });
        showToast.success(onTeam.length === 1 ? "Task assigned" : `Task assigned to ${onTeam.length} people`);
      }
      onClose();
    } catch (err) {
      setError(errorText(err, "Couldn't save the task"));
    }
  }

  const busy = create.isPending || update.isPending;
  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "New task"} description={linked ? `About ${linked.name}` : undefined} maxWidth="lg">
      <form onSubmit={save} noValidate className="space-y-4">
        <div>
          <span className={labelClass}>Title *</span>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        </div>
        <div>
          <span className={labelClass}>Description</span>
          <textarea className={`${inputClass} min-h-[72px]`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <span className={labelClass}>Type</span>
            <Select
              className={selectClass}
              aria-label="Type"
              value={type}
              onChange={(v) => setType(v as TaskType)}
              options={(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((k) => ({ value: k, label: TASK_TYPE_LABEL[k] }))}
            />
          </div>
          <div>
            <span className={labelClass}>Priority</span>
            <Select
              className={selectClass}
              aria-label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as TaskPriority)}
              options={(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((k) => ({ value: k, label: TASK_PRIORITY_LABEL[k] }))}
            />
          </div>
          <div>
            <span className={labelClass}>Due date</span>
            <input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>

        <div>
          <span className={labelClass}>Assign to *</span>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">{team.isLoading ? "Loading the team…" : "Nobody is on the team yet."}</p>
          ) : (
            <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
              {members.map((m) => {
                const on = assignees.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(m.id)}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors ${
                      on
                        ? "bg-[#87102C] text-white"
                        : "border border-gray-200 text-gray-700 hover:border-[#87102C]/40 dark:border-white/10 dark:text-white/80"
                    }`}
                  >
                    {on && <Check size={12} aria-hidden="true" />} {m.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Saving…" : task ? "Save" : "Assign task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
