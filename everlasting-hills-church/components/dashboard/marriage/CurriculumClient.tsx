"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMarriageAccess, useModules, type CounsellingModule } from "@/lib/api/premarital";
import { ModuleForm } from "./ModuleForm";
import { PageHeader, QueryState, card, primary, secondary, useRun } from "./ui";

/** The curriculum: reorder, switch on or off, edit, add. A Pastor approves each module before it stops being "proposed". */
export default function CurriculumClient() {
  const q = useModules();
  const access = useMarriageAccess();
  const { run, pending } = useRun();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const modules = q.data ?? [];
  const isPastor = access.data?.tier === "PASTOR";

  function move(i: number, by: -1 | 1) {
    const ids = modules.map((m) => m.id);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    void run("put", "/premarital/modules/order", { ids }, "Order saved");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Curriculum" subtitle="The modules couples work through. Editing an approved module sends it back for a Pastor's approval.">
        <button type="button" className={primary} onClick={() => setEditing("new")}>Add a module</button>
      </PageHeader>
      <QueryState isLoading={q.isLoading} error={q.error} />
      {editing === "new" && <ModuleForm onDone={() => setEditing(null)} />}
      <ol className="space-y-2">
        {modules.map((m, i) => (
          <li key={m.id} className={card}>
            {editing === m.id ? (
              <ModuleForm module={m} onDone={() => setEditing(null)} />
            ) : (
              <ModuleRow m={m} first={i === 0} last={i === modules.length - 1} pending={pending} isPastor={isPastor}
                onUp={() => move(i, -1)} onDown={() => move(i, 1)} onEdit={() => setEditing(m.id)}
                onToggle={() => run("patch", `/premarital/modules/${m.id}`, { active: !m.active }, m.active ? "Module switched off" : "Module switched on")}
                onApprove={() => run("post", `/premarital/modules/${m.id}/approve`, {}, "Module approved")} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ModuleRow(p: { m: CounsellingModule; first: boolean; last: boolean; pending: boolean; isPastor: boolean; onUp: () => void; onDown: () => void; onEdit: () => void; onToggle: () => void; onApprove: () => void }) {
  const { m } = p;
  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="flex flex-col gap-1">
        <button type="button" aria-label={`Move ${m.title} up`} className={`${secondary} min-h-9 px-2`} disabled={p.first || p.pending} onClick={p.onUp}><ArrowUp size={14} /></button>
        <button type="button" aria-label={`Move ${m.title} down`} className={`${secondary} min-h-9 px-2`} disabled={p.last || p.pending} onClick={p.onDown}><ArrowDown size={14} /></button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-[#111] dark:text-white">
          {m.title}
          <span className={`rounded-full px-2 py-0.5 text-xs ${m.approvalState === "APPROVED" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"}`}>
            {m.approvalState === "APPROVED" ? "Approved" : "Proposed"}
          </span>
          {!m.active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-white/10 dark:text-white/70">Off</span>}
        </p>
        {m.description && <p className="mt-1 text-sm text-gray-600 dark:text-white/60">{m.description}</p>}
        {m.scriptureRefs.length > 0 && <p className="mt-1 text-xs text-[#87102C] dark:text-[#f3a9b8]">{m.scriptureRefs.join(", ")}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondary} onClick={p.onEdit}>Edit</button>
        <button type="button" className={secondary} disabled={p.pending} onClick={p.onToggle}>{m.active ? "Switch off" : "Switch on"}</button>
        {p.isPastor && m.approvalState === "PROPOSED" && <button type="button" className={primary} disabled={p.pending} onClick={p.onApprove}>Approve</button>}
      </div>
    </div>
  );
}
