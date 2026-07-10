"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, Users, UserCog, UserPlus, UserMinus, Crown,
  Layers, Plus, X, History, Megaphone, Check, Send,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useDepartment, useDepartments, useAssignHead, useRemoveHead,
  useAssignUnits, useUnassignUnit, useDeptAnnouncement,
} from "@/lib/api/departments";
import HeadPicker, { Avatar } from "./HeadPicker";
import UnitLeadControl from "./UnitLeadControl";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DepartmentDetail({ id }: { id: string }) {
  const q = useDepartment(id);
  const index = useDepartments();
  const assignHead = useAssignHead(id);
  const removeHead = useRemoveHead(id);
  const assignUnits = useAssignUnits(id);
  const unassignUnit = useUnassignUnit(id);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (q.isLoading || !q.data) {
    return <div className="max-w-4xl space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" /><div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" /></div>;
  }

  const { department: d, currentHead, units, history, memberCount } = q.data;
  const unassigned = index.data?.unassignedUnits ?? [];

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/departments" className="mt-0.5 rounded-lg p-2 text-gray-400 hover:bg-[#87102C]/5 hover:text-[#87102C]" aria-label="Back to departments">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#87102C]/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]">
            <Building2 size={12} /> {d.code}
          </span>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{d.name}</h1>
          {d.description && <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{d.description}</p>}
          <div className="mt-2 flex items-center gap-4 text-[12px] font-semibold text-gray-400 dark:text-white/40">
            <span className="inline-flex items-center gap-1"><Layers size={13} /> {units.length} units</span>
            <span className="inline-flex items-center gap-1"><Users size={13} /> {memberCount} members</span>
          </div>
        </div>
      </div>

      {/* Current head */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Crown size={15} className="text-[#87102C] dark:text-[#e8768a]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Admin Head</h2>
        </div>
        {currentHead ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={currentHead.name} photoUrl={currentHead.photoUrl} px={44} />
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{currentHead.name}</p>
                {currentHead.assignedAt && <p className="text-[12px] text-gray-400">Since {fmt(currentHead.assignedAt)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10">
                <UserPlus size={15} /> Replace
              </button>
              <button type="button" onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 px-3.5 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <UserMinus size={15} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-white/40"><UserCog size={16} /> No head assigned</span>
            <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24]">
              <UserPlus size={15} /> Assign head
            </button>
          </div>
        )}
      </section>

      {/* Units */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-[#87102C] dark:text-[#e8768a]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Units</h2>
          </div>
        </div>
        <ul className="space-y-2">
          {units.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{u.name}</p>
                <p className="text-[11px] text-gray-400">
                  {u.lead ? `Lead: ${u.lead.firstName} ${u.lead.lastName}` : "No lead"} · {u.memberCount} member{u.memberCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UnitLeadControl unitId={u.id} leadName={u.lead ? `${u.lead.firstName} ${u.lead.lastName}` : null} />
                <button type="button" onClick={() => unassignUnit.mutate(u.id)} disabled={unassignUnit.isPending} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-rose-600 disabled:opacity-50">
                  <X size={13} /> Unassign
                </button>
              </div>
            </li>
          ))}
          {units.length === 0 && <p className="py-3 text-center text-sm text-gray-400">No units assigned yet.</p>}
        </ul>

        {unassigned.length > 0 && (
          <div className="mt-4 border-t border-gray-100 dark:border-white/[0.06] pt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Add unassigned units</p>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((u) => (
                <button key={u.id} type="button" onClick={() => assignUnits.mutate([u.id])} disabled={assignUnits.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6]/60 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFE8ED] disabled:opacity-50">
                  <Plus size={12} /> {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Announcement composer */}
      <DeptAnnouncementComposer id={id} />

      {/* Succession history */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
        <div className="mb-3 flex items-center gap-2">
          <History size={15} className="text-[#87102C] dark:text-[#e8768a]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Succession history</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No heads assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5">
                <Avatar name={h.user?.name ?? "Unknown"} photoUrl={h.user?.photoUrl ?? null} px={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {h.user?.name ?? "Unknown"}
                    {!h.endedAt && <span className="ml-2 rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Current</span>}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {fmt(h.assignedAt)} {h.endedAt ? `to ${fmt(h.endedAt)}` : "to present"}
                    {h.assignedBy && ` · assigned by ${h.assignedBy.name}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <HeadPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pending={assignHead.isPending}
        currentHeadName={currentHead?.name ?? null}
        onPick={async (profileId) => { await assignHead.mutateAsync(profileId); setPickerOpen(false); }}
      />

      <ConfirmDialog
        open={confirmRemove}
        title="Remove department head?"
        description="This ends their tenure. They keep the Admin Head role but will see an empty dashboard until reassigned."
        confirmLabel="Yes, remove"
        tone="warning"
        loading={removeHead.isPending}
        onConfirm={async () => { await removeHead.mutateAsync(); setConfirmRemove(false); }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}

function DeptAnnouncementComposer({ id }: { id: string }) {
  const post = useDeptAnnouncement(id);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    const res = await post.mutateAsync({ title: title.trim(), body: body.trim() });
    setSent(res.recipients);
    setTitle("");
    setBody("");
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Megaphone size={15} className="text-[#87102C] dark:text-[#e8768a]" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Announce to this department</h2>
      </div>
      <div className="space-y-2.5">
        <input value={title} onChange={(e) => { setTitle(e.target.value); setSent(null); }} placeholder="Title" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20" />
        <textarea value={body} onChange={(e) => { setBody(e.target.value); setSent(null); }} rows={3} placeholder="Message to members in this department's units" className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={submit} disabled={post.isPending || !title.trim() || !body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-40">
            <Send size={14} /> {post.isPending ? "Sending…" : "Send announcement"}
          </button>
          {sent !== null && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <Check size={15} /> Delivered to {sent} member{sent === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
