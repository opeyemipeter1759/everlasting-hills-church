"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Cake,
  CheckCircle2, Clock, Plus, Trash2, CheckSquare, Square,
  BookOpen, Shield, AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type MemberDetailProps = {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    bio: string | null;
    photoUrl: string | null;
    dateOfBirth: string | null;
    joinedAt: string;
    status: string;
    attendanceCount: number;
    recentAttendance: { serviceId: string; serviceName: string; scheduledAt: string }[];
    pastorNotes: { id: string; content: string; createdAt: string }[];
    followUpTasks: { id: string; title: string; done: boolean; dueDate: string | null; createdAt: string }[];
    units: string[];
  };
};

const STATUS_OPTS = [
  { value: "ACTIVE",      label: "Active",      color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { value: "INACTIVE",    label: "Inactive",    color: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400" },
  { value: "TRANSFERRED", label: "Transferred", color: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { value: "DECEASED",    label: "Deceased",    color: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-400 dark:text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
          <Icon size={13} className="text-[#87102C] dark:text-[#e8768a]" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberDetail({ member: initial }: MemberDetailProps) {
  const [status, setStatus]         = useState(initial.status);
  const [statusLoading, setStatusLoading] = useState(false);

  const [notes, setNotes]           = useState(initial.pastorNotes);
  const [noteText, setNoteText]     = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const [tasks, setTasks]           = useState(initial.followUpTasks);
  const [taskText, setTaskText]     = useState("");
  const [taskDue, setTaskDue]       = useState("");
  const [taskLoading, setTaskLoading] = useState(false);

  const statusOpt = STATUS_OPTS.find((s) => s.value === status) ?? STATUS_OPTS[0];

  // ── Status change ────────────────────────────────────────────────────────────

  async function handleStatusChange(next: string) {
    setStatusLoading(true);
    try {
      await fetch(`/api/members/${initial.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
    } finally { setStatusLoading(false); }
  }

  // ── Pastor notes ─────────────────────────────────────────────────────────────

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/members/${initial.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      const json = await res.json();
      setNotes((prev) => [json.data, ...prev]);
      setNoteText("");
    } finally { setNoteLoading(false); }
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/members/${initial.id}/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  // ── Follow-up tasks ──────────────────────────────────────────────────────────

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskText.trim()) return;
    setTaskLoading(true);
    try {
      const res = await fetch(`/api/members/${initial.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskText.trim(), dueDate: taskDue || undefined }),
      });
      const json = await res.json();
      setTasks((prev) => [json.data, ...prev]);
      setTaskText("");
      setTaskDue("");
    } finally { setTaskLoading(false); }
  }

  async function handleToggleTask(taskId: string, done: boolean) {
    await fetch(`/api/members/${initial.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done } : t));
  }

  async function handleDeleteTask(taskId: string) {
    await fetch(`/api/members/${initial.id}/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Back + Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/members"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {initial.photoUrl ? (
            <img src={initial.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-[#87102C] dark:text-[#e8768a] font-bold text-sm flex-shrink-0">
              {initial.firstName[0]}{initial.lastName[0]}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {initial.firstName} {initial.lastName}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Member since {fmtDate(initial.joinedAt)}</p>
          </div>
        </div>

        {/* Status selector */}
        <div className="flex-shrink-0">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusLoading}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 disabled:opacity-60 ${statusOpt.color}`}
          >
            {STATUS_OPTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Profile info */}
          <Card title="Profile" icon={User}>
            {initial.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 pb-4 border-b border-gray-100 dark:border-white/8">
                {initial.bio}
              </p>
            )}
            <div className="space-y-3">
              <InfoRow icon={Mail}     label="Email"         value={initial.email} />
              <InfoRow icon={Phone}    label="Phone"         value={initial.phone} />
              <InfoRow icon={MapPin}   label="Address"       value={initial.address} />
              <InfoRow icon={Cake}     label="Date of Birth" value={fmtDate(initial.dateOfBirth)} />
              <InfoRow icon={Calendar} label="Member Since"  value={fmtDate(initial.joinedAt)} />
            </div>
          </Card>

          {/* Units */}
          {initial.units.length > 0 && (
            <Card title="Units / Ministries" icon={Shield}>
              <div className="flex flex-wrap gap-2">
                {initial.units.map((u) => (
                  <span key={u} className="text-xs font-medium bg-[#87102C]/8 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] px-2.5 py-1 rounded-full">
                    {u}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Attendance summary */}
          <Card title="Attendance" icon={CheckCircle2}>
            <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">
              {initial.attendanceCount}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">total check-ins</p>
            {initial.recentAttendance.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Recent Services</p>
                {initial.recentAttendance.slice(0, 6).map((a) => (
                  <div key={a.serviceId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300 truncate mr-2">{a.serviceName}</span>
                    <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{fmtShort(a.scheduledAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pastor's Notes */}
          <Card title="Pastor's Notes (Private)" icon={BookOpen}>
            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a private note…"
                className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
              />
              <button
                type="submit"
                disabled={noteLoading || !noteText.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </form>

            {notes.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-start gap-3 group">
                    <div className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{note.content}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{fmtDate(note.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Follow-up Tasks */}
          <Card title="Follow-up Tasks" icon={AlertTriangle}>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="New follow-up task…"
                className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
              />
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all hidden sm:block"
              />
              <button
                type="submit"
                disabled={taskLoading || !taskText.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </form>

            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id, !task.done)}
                      className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
                    >
                      {task.done
                        ? <CheckSquare size={16} className="text-emerald-500 dark:text-emerald-400" />
                        : <Square size={16} />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${task.done ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}`}>
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          <Clock size={9} /> Due {fmtDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
