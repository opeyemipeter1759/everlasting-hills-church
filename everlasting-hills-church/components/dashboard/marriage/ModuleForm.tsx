"use client";

import { useState } from "react";
import type { CounsellingModule } from "@/lib/api/premarital";
import { card, input, primary, secondary, useRun } from "./ui";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

/** Add a module, or edit one. Only the fields changed are sent. */
export function ModuleForm({ module: m, onDone }: { module?: CounsellingModule; onDone: () => void }) {
  const { run, pending } = useRun();
  const [title, setTitle] = useState(m?.title ?? "");
  const [description, setDescription] = useState(m?.description ?? "");
  const [scripture, setScripture] = useState((m?.scriptureRefs ?? []).join("\n"));
  const [objectives, setObjectives] = useState((m?.objectives ?? []).join("\n"));

  async function save() {
    const next = { title: title.trim(), description: description.trim() || null, scriptureRefs: lines(scripture), objectives: lines(objectives) };
    const body = m
      ? Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(m[k as keyof typeof next] ?? null)))
      : next;
    if (m && Object.keys(body).length === 0) return onDone();
    const ok = m ? await run("patch", `/premarital/modules/${m.id}`, body, "Module saved") : await run("post", "/premarital/modules", body, "Module added");
    if (ok) onDone();
  }

  const field = "block text-sm font-semibold text-[#111] dark:text-white/90";
  return (
    <div className={m ? "space-y-3" : `${card} space-y-3`}>
      <label className={field}>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={`${input} mt-1`} />
      </label>
      <label className={field}>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className={`${input} mt-1 py-2`} />
      </label>
      <label className={field}>
        Scripture, one per line
        <textarea value={scripture} onChange={(e) => setScripture(e.target.value)} rows={3} className={`${input} mt-1 py-2`} />
      </label>
      <label className={field}>
        What couples will take away, one per line
        <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3} className={`${input} mt-1 py-2`} />
      </label>
      <div className="flex gap-2">
        <button type="button" className={primary} disabled={title.trim().length < 3 || pending} onClick={save}>{m ? "Save" : "Add module"}</button>
        <button type="button" className={secondary} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
