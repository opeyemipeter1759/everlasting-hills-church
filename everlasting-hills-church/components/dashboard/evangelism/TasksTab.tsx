"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Edit3, ListChecks, MessageSquare, Plus, Trash2, UserRound } from "lucide-react";
import { Select } from "@/components/ui/select";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import {
  useAddTaskNote,
  useDeleteTask,
  useEvangelismMe,
  useEvangelismTasks,
  useUpdateTask,
  type EvangelismTask,
  type TaskStatus,
} from "@/lib/api/evangelism";
import { TaskDialog } from "./TaskDialog";
import { EmptyState, ErrorNote, Loading, cardClass, primaryButton } from "./bits";
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABEL,
  TASK_TYPE_LABEL,
  errorText,
  fmtDate,
  fmtDateTime,
  inputClass,
} from "./labels";

type View = "mine" | "all";

export function TasksTab({
  canLead,
  focusTaskId,
  onOpenContact,
}: {
  canLead: boolean;
  focusTaskId: string | null;
  onOpenContact: (id: string) => void;
}) {
  const [view, setView] = useState<View>("mine");
  const [status, setStatus] = useState<"" | "OPEN" | TaskStatus>("OPEN");
  const [creating, setCreating] = useState(false);
  const tasks = useEvangelismTasks(view, view === "mine" || canLead);

  const rows = (tasks.data ?? []).filter((t) => (status === "OPEN" ? t.status !== "DONE" : status ? t.status === status : true));
  const overdue = (tasks.data ?? []).filter((t) => t.overdue).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canLead && (
          <div className="inline-flex rounded-xl border border-gray-200 p-0.5 dark:border-white/10" role="radiogroup" aria-label="Whose tasks">
            {(["mine", "all"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={`min-h-9 rounded-lg px-3 text-xs font-bold ${view === v ? "bg-[#87102C] text-white" : "text-gray-600 dark:text-white/60"}`}
              >
                {v === "mine" ? "My tasks" : "All tasks"}
              </button>
            ))}
          </div>
        )}
        <div className="w-40">
          <Select
            aria-label="Status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "OPEN", label: "Open" },
              { value: "PENDING", label: "Pending" },
              { value: "IN_PROGRESS", label: "In progress" },
              { value: "DONE", label: "Done" },
              { value: "", label: "All" },
            ]}
          />
        </div>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
            <AlertTriangle size={12} aria-hidden="true" /> {overdue} overdue
          </span>
        )}
        {canLead && (
          <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} ml-auto`}>
            <Plus size={15} aria-hidden="true" /> New task
          </button>
        )}
      </div>

      {tasks.isLoading ? (
        <Loading />
      ) : tasks.isError ? (
        <ErrorNote>{errorText(tasks.error, "Couldn't load tasks.")}</ErrorNote>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={view === "mine" ? "No tasks for you right now" : "No tasks here"}
          body={view === "mine" ? "When a leader gives you a task, it shows up here and in your notifications." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <TaskCard key={t.id} task={t} canLead={canLead} focused={t.id === focusTaskId} onOpenContact={onOpenContact} />
          ))}
        </ul>
      )}

      <TaskDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

export function TaskCard({
  task: t,
  canLead,
  focused = false,
  onOpenContact,
}: {
  task: EvangelismTask;
  canLead: boolean;
  focused?: boolean;
  onOpenContact: (id: string) => void;
}) {
  const me = useEvangelismMe();
  const update = useUpdateTask();
  const addNote = useAddTaskNote();
  const remove = useDeleteTask();
  const [note, setNote] = useState("");
  const [showNotes, setShowNotes] = useState(focused);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const mine = !!me.data?.memberId && t.assignees.some((a) => a.id === me.data?.memberId);
  const canWork = canLead || mine;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);

  async function setStatus(status: TaskStatus) {
    try {
      await update.mutateAsync({ id: t.id, status });
      if (status === "DONE") showToast.success("Task done — well done!");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't update"));
    }
  }

  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await addNote.mutateAsync({ id: t.id, body: note.trim() });
      setNote("");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't add the note"));
    }
  }

  return (
    <li
      ref={ref}
      className={`${cardClass} p-4 ${t.overdue ? "border-l-4 border-l-rose-500" : ""} ${focused ? "ring-2 ring-[#87102C]/40" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
              {TASK_TYPE_LABEL[t.type]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TASK_PRIORITY_TONE[t.priority]}`}>
              {TASK_PRIORITY_LABEL[t.priority]}
            </span>
            {t.overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                <AlertTriangle size={11} aria-hidden="true" /> Overdue
              </span>
            )}
          </div>
          <p className={`mt-1.5 text-sm font-bold ${t.status === "DONE" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
            {t.title}
          </p>
          {t.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-white/70">{t.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-white/50">
            {t.contact && (
              <button type="button" onClick={() => onOpenContact(t.contact!.id)} className="inline-flex items-center gap-1 font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                <UserRound size={11} aria-hidden="true" /> {t.contact.name}
              </button>
            )}
            {t.dueAt && (
              <span className={`inline-flex items-center gap-1 ${t.overdue ? "font-bold text-rose-600" : ""}`}>
                <CalendarClock size={11} aria-hidden="true" /> Due {fmtDate(t.dueAt)}
              </span>
            )}
            <span>For {t.assignees.map((a) => a.name).join(", ")}</span>
            {t.createdBy && <span>· from {t.createdBy}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {canWork ? (
            <div className="w-36">
              <Select
                aria-label="Task status"
                value={t.status}
                disabled={update.isPending}
                onChange={(v) => setStatus(v as TaskStatus)}
                options={(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((k) => ({ value: k, label: TASK_STATUS_LABEL[k] }))}
              />
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-500">{TASK_STATUS_LABEL[t.status]}</span>
          )}
          {canLead && (
            <>
              <button type="button" onClick={() => setEditing(true)} aria-label="Edit task" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10">
                <Edit3 size={15} />
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete task" className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/10">
        <button type="button" onClick={() => setShowNotes((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white">
          <MessageSquare size={13} aria-hidden="true" /> {t.notes.length ? `${t.notes.length} note${t.notes.length === 1 ? "" : "s"}` : "Notes"}
        </button>
        {showNotes && (
          <div className="mt-3 space-y-3">
            {t.notes.map((n) => (
              <div key={n.id} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-white/[0.04]">
                <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-white/80">{n.body}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {n.author.name} · {fmtDateTime(n.createdAt)}
                </p>
              </div>
            ))}
            {canWork && (
              <form onSubmit={saveNote} className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" aria-label="Add a note" maxLength={2000} className={inputClass} />
                <button type="submit" disabled={addNote.isPending || !note.trim()} className={primaryButton}>
                  Add
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <TaskDialog open={editing} onClose={() => setEditing(false)} task={t} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this task?"
        description={`"${t.title}" will be removed for everyone on it.`}
        confirmLabel="Delete task"
        tone="danger"
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(t.id);
            setConfirmDelete(false);
          } catch (err) {
            showToast.error(errorText(err, "Couldn't delete"));
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </li>
  );
}
