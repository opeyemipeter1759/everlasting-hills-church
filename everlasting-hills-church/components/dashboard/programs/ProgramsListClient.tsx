"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowUp, GripVertical, Plus, Star } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { usePrograms, useProgramAction, useReorder, type AdminProgramRow } from "@/lib/api/programs-admin";
import { card, primary, secondary, STATUS_CHIP } from "./ui";

/** Every program, in the order the public page shows them. Drag a row (or use the arrows) to reorder. */
export default function ProgramsListClient() {
  const q = usePrograms();
  const reorder = useReorder();
  const action = useProgramAction();
  const [dragging, setDragging] = useState<string | null>(null);
  const rows = q.data ?? [];

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const ids = rows.map((r) => r.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    reorder.mutate(ids, { onError: (e) => showToast.error((e as ApiError).message || "The new order was not saved.") });
  };
  const toggleFeatured = (r: AdminProgramRow) =>
    action.mutate({ method: "patch", path: `/programs/${r.id}`, body: { featured: !r.featured } }, { onError: (e) => showToast.error((e as ApiError).message || "That did not save.") });

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111] dark:text-white">Programs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">What the public Programs page shows, in this order. Drag a row to move it.</p>
        </div>
        <Link href="/dashboard/admin/programs/new" className={primary}>
          <Plus size={16} aria-hidden="true" /> New program
        </Link>
      </header>
      {q.isLoading && <p className="text-sm text-gray-600 dark:text-white/60">Loading programs…</p>}
      {q.error && <p className="text-sm text-red-700 dark:text-red-300">The programs could not be loaded. Refresh to try again.</p>}
      {q.data && rows.length === 0 && (
        <div className={`${card} text-center`}>
          <p className="font-semibold text-[#111] dark:text-white">No programs yet</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">Create the first one; it stays a draft until you publish it.</p>
        </div>
      )}
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            draggable
            onDragStart={() => setDragging(r.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              const from = rows.findIndex((x) => x.id === dragging);
              setDragging(null);
              move(from, i);
            }}
            className={`${card} flex flex-wrap items-center gap-3 ${dragging === r.id ? "opacity-50" : ""}`}
          >
            <GripVertical size={18} className="hidden cursor-grab text-gray-400 sm:block" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/admin/programs/${r.id}`} className="font-semibold text-[#111] hover:underline dark:text-white">
                  {r.name}
                </Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[r.status].cls}`}>{STATUS_CHIP[r.status].label}</span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-white/60">{r.schedule}</p>
              {r.attention.length > 0 && (
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.attention.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
                      <AlertTriangle size={12} aria-hidden="true" /> {a}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <button type="button" onClick={() => toggleFeatured(r)} aria-pressed={r.featured} className={secondary} title="Featured programs come first in their group">
              <Star size={15} aria-hidden="true" className={r.featured ? "fill-[#C8A04A] text-[#C8A04A]" : ""} /> {r.featured ? "Featured" : "Feature"}
            </button>
            <div className="flex gap-1">
              <button type="button" className={secondary} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${r.name} up`}>
                <ArrowUp size={15} aria-hidden="true" />
              </button>
              <button type="button" className={secondary} onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Move ${r.name} down`}>
                <ArrowDown size={15} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
