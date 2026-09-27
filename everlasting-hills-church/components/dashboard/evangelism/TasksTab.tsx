"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Check, ListChecks, MessageSquare, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { EmptyState, ErrorNote, Initials, Loading, cardClass, iconButton, primaryButton, selectClass } from "./bits";
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
type Show = "OPEN" | "ALL" | TaskStatus;

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
  const [show, setShow] = useState<Show>("OPEN");
  const [creating, setCreating] = useState(false);
  const tasks = useEvangelismTasks(view, view === "mine" || canLead);

  const all = tasks.data ?? [];
  const visible = all.filter((t) => (show === "OPEN" ? t.status !== "DONE" : show === "ALL" ? true : t.status === show));
  const groups: { title: string; tone: string; rows: EvangelismTask[] }[] = [
    { title: "Overdue", tone: "text-rose-600 dark:text-rose-400", rows: visible.filter((t) => t.overdue) },
    { title: "To do", tone: "text-gray-900 dark:text-white", rows: visible.filter((t) => !t.overdue && t.status !== "DONE") },
    { title: "Done", tone: "text-gray-500 dark:text-white/50", rows: visible.filter((t) => t.status === "DONE") },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canLead && (
          <div className="inline-flex h-10 items-center rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]" role="radiogroup" aria-label="Whose tasks">
            {(["mine", "all"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={`h-8 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                  view === v ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:text-white/50"
                }`}
              >
                {v === "mine" ? "My tasks" : "Everyone's"}
              </button>
            ))}
          </div>
        )}
        <div className="w-44">
          <Select
            aria-label="Show"
            prefixLabel="Show:"
            className={selectClass}
            value={show}
            onChange={(v) => setShow(v as Show)}
            options={[
              { value: "OPEN", label: "Open" },
              { value: "PENDING", label: "Pending" },
              { value: "IN_PROGRESS", label: "In progress" },
              { value: "DONE", label: "Done" },
              { value: "ALL", label: "All" },
            ]}
          />
        </div>
        {canLead && (
          <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} ml-auto`}>
            <Plus size={16} aria-hidden="true" /> New task
          </button>
        )}
      </div>

      {tasks.isLoading ? (
        <Loading />
      ) : tasks.isError ? (
        <ErrorNote>{errorText(tasks.error, "Couldn't load tasks.")}</ErrorNote>
      ) : groups.length === 0 ? (
        <div className={cardClass}>
          <EmptyState
            icon={ListChecks}
            title={view === "mine" ? "Nothing on your list" : "No tasks here"}
            body={view === "mine" ? "When a leader gives you a task, it appears here and in your notifications." : undefined}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.title} className="space-y-2.5">
              <h3 className={`flex items-center gap-2 text-sm font-semibold ${g.tone}`}>
                {g.title}
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600 dark:bg-white/10 dark:text-white/60">
                  {g.rows.length}
                </span>
              </h3>
              <ul className={`${cardClass} divide-y divide-gray-100 overflow-hidden dark:divide-white/[0.06]`}>
                {g.rows.map((t) => (
                  <TaskCard key={t.id} task={t} canLead={canLead} focused={t.id === focusTaskId} onOpenContact={onOpenContact} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <TaskDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

/** One task as a row: tick it off, read it, change its status, open its notes. */
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
  const done = t.status === "DONE";

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
    <li ref={ref} className={`px-4 py-4 sm:px-5 ${focused ? "bg-[#FFF5F7] dark:bg-[#87102C]/10" : ""}`}>
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          disabled={!canWork || update.isPending}
          onClick={() => setStatus(done ? "PENDING" : "DONE")}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          title={done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-default ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-white/25"
          }`}
        >
          <Check size={13} strokeWidth={3} aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${done ? "text-gray-400 line-through dark:text-white/40" : "text-gray-900 dark:text-white"}`}>{t.title}</p>
              {t.description && <p className="mt-1 text-sm text-gray-600 dark:text-white/65">{t.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-white/45">
                <span className="font-medium text-gray-600 dark:text-white/60">{TASK_TYPE_LABEL[t.type]}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${TASK_PRIORITY_TONE[t.priority]}`}>{TASK_PRIORITY_LABEL[t.priority]}</span>
                {t.dueAt && (
                  <span className={`inline-flex items-center gap-1 ${t.overdue ? "font-semibold text-rose-600 dark:text-rose-400" : ""}`}>
                    <CalendarClock size={13} aria-hidden="true" /> {t.overdue ? `Overdue · ${fmtDate(t.dueAt)}` : `Due ${fmtDate(t.dueAt)}`}
                  </span>
                )}
                {t.contact && (
                  <button
                    type="button"
                    onClick={() => onOpenContact(t.contact!.id)}
                    className="inline-flex items-center gap-1 font-medium text-[#87102C] hover:underline dark:text-[#FFB3C1]"
                  >
                    <UserRound size={13} aria-hidden="true" /> {t.contact.name}
                  </button>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {canWork ? (
                <div className="w-36">
                  <Select
                    aria-label="Task status"
                    className={`${selectClass} h-9`}
                    value={t.status}
                    disabled={update.isPending}
                    onChange={(v) => setStatus(v as TaskStatus)}
                    options={(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((k) => ({ value: k, label: TASK_STATUS_LABEL[k] }))}
                  />
                </div>
              ) : (
                <span className="text-xs font-medium text-gray-500">{TASK_STATUS_LABEL[t.status]}</span>
              )}
              {canLead && (
                <>
                  <button type="button" onClick={() => setEditing(true)} aria-label="Edit task" title="Edit" className={iconButton}>
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete task"
                    title="Delete"
                    className={`${iconButton} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10`}
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {t.assignees.slice(0, 4).map((a) => (
                  <span key={a.id} title={a.name} className="rounded-full ring-2 ring-white dark:ring-[#161618]">
                    <Initials name={a.name} size={26} single />
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-white/45">
                {t.assignees.map((a) => a.name.split(" ")[0]).join(", ")}
                {t.createdBy ? ` · from ${t.createdBy}` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              aria-expanded={showNotes}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
            >
              <MessageSquare size={14} aria-hidden="true" />
              {t.notes.length ? `${t.notes.length} note${t.notes.length === 1 ? "" : "s"}` : "Add note"}
            </button>
          </div>

          {showNotes && (
            <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
              {t.notes.map((n) => (
                <div key={n.id} className="text-sm">
                  <p className="whitespace-pre-wrap break-words text-gray-700 dark:text-white/80">{n.body}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {n.author.name} · {fmtDateTime(n.createdAt)}
                  </p>
                </div>
              ))}
              {canWork && (
                <form onSubmit={saveNote} className="flex gap-2 pt-1">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write a note…"
                    aria-label="Add a note"
                    maxLength={2000}
                    className={`${inputClass} h-9 py-0`}
                  />
                  <button type="submit" disabled={addNote.isPending || !note.trim()} className={`${primaryButton} h-9`}>
                    Add
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
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
