"use client";

import { useState } from "react";
import { Building2, Users, Layers, Megaphone, Send, Check, Bell, Inbox } from "lucide-react";
import {
  useMyDepartments, useMyDeptAnnouncement, useNudgeLead, type MyDepartment as MyDept,
} from "@/lib/api/departments";
import { Avatar } from "./HeadPicker";

export default function MyDepartment() {
  const q = useMyDepartments();

  if (q.isLoading) {
    return <div className="max-w-3xl space-y-4"><div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" /><div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" /></div>;
  }

  const departments = q.data?.departments ?? [];

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
          <Building2 size={16} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">My Department</h1>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            The units, leads, and members you oversee as an Admin Head.
          </p>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
          <Inbox size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">You have not been assigned a department yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">
            When a Pastor or Admin assigns you as a department head, your units and members appear here.
          </p>
        </div>
      ) : (
        departments.map((d) => <DepartmentPanel key={d.id} dept={d} />)
      )}
    </div>
  );
}

function DepartmentPanel({ dept }: { dept: MyDept }) {
  const announce = useMyDeptAnnouncement();
  const nudge = useNudgeLead();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<number | null>(null);
  const [nudged, setNudged] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    const res = await announce.mutateAsync({ departmentId: dept.id, title: title.trim(), body: body.trim() });
    setSent(res.recipients);
    setTitle("");
    setBody("");
  }

  async function doNudge(unitId: string) {
    await nudge.mutateAsync({ unitId });
    setNudged(unitId);
    setTimeout(() => setNudged(null), 2500);
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]">
            <Building2 size={12} /> {dept.code}
          </span>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{dept.name}</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400 dark:text-white/40">
          <span className="inline-flex items-center gap-1"><Layers size={12} /> {dept.units.length}</span>
          <span className="inline-flex items-center gap-1"><Users size={12} /> {dept.memberCount}</span>
        </div>
      </div>

      {/* Units */}
      <ul className="space-y-2">
        {dept.units.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {u.lead ? <Avatar name={`${u.lead.firstName} ${u.lead.lastName}`} photoUrl={u.lead.photoUrl} px={32} /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-400"><Users size={14} /></span>}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{u.name}</p>
                <p className="text-[11px] text-gray-400">{u.lead ? `Lead: ${u.lead.firstName} ${u.lead.lastName}` : "No lead"} · {u.memberCount} member{u.memberCount === 1 ? "" : "s"}</p>
              </div>
            </div>
            {u.lead && (
              nudged === u.id ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><Check size={13} /> Nudged</span>
              ) : (
                <button type="button" onClick={() => doNudge(u.id)} disabled={nudge.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 hover:text-[#87102C] hover:border-[#87102C]/30 disabled:opacity-50">
                  <Bell size={13} /> Nudge lead
                </button>
              )
            )}
          </li>
        ))}
        {dept.units.length === 0 && <p className="py-3 text-center text-sm text-gray-400">No units in this department yet.</p>}
      </ul>

      {/* Announcement composer */}
      <div className="mt-5 border-t border-gray-100 dark:border-white/[0.06] pt-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Megaphone size={14} className="text-[#87102C] dark:text-[#e8768a]" />
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Announce to your department</p>
        </div>
        <div className="space-y-2.5">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSent(null); }} placeholder="Title" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20" />
          <textarea value={body} onChange={(e) => { setBody(e.target.value); setSent(null); }} rows={3} placeholder="Message to members in your department's units" className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={submit} disabled={announce.isPending || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40">
              <Send size={14} /> {announce.isPending ? "Sending…" : "Send"}
            </button>
            {sent !== null && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><Check size={15} /> Delivered to {sent} member{sent === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
