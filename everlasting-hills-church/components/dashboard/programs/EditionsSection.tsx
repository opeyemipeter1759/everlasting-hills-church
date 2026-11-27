"use client";

import { Plus, X } from "lucide-react";
import type { Edition } from "@/lib/programs";
import type { ProgramDraft } from "./useProgramDraft";
import { card, hint, input, label, secondary, sectionTitle } from "./ui";

/** Each year of an annual program (Furnace '26): its theme and dates. Confirmed dates override the schedule. */
export function EditionsSection({ draft }: { draft: ProgramDraft }) {
  const { editions, setEditions } = draft;
  const update = (i: number, next: Partial<Edition>) => setEditions(editions.map((e, j) => (j === i ? { ...e, ...next } : e)));
  return (
    <section id="editions" className={`${card} space-y-4`} aria-labelledby="editions-title">
      <div>
        <h2 id="editions-title" className={sectionTitle}>Editions</h2>
        <p className={hint}>For a yearly program with a theme each year. Once an edition&apos;s dates are confirmed they replace the schedule.</p>
      </div>
      {editions.map((e, i) => (
        <fieldset key={i} className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <legend className="sr-only">Edition {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Name</span>
              <input className={`${input} mt-1`} value={e.label} maxLength={60} placeholder="Furnace '27" onChange={(ev) => update(i, { label: ev.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Theme</span>
              <input className={`${input} mt-1`} value={e.theme ?? ""} maxLength={80} onChange={(ev) => update(i, { theme: ev.target.value || null })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#111] dark:text-white/85">
            <input type="checkbox" className="h-4 w-4 accent-[#87102C]" checked={e.dateStatus === "CONFIRMED"} onChange={(ev) => update(i, { dateStatus: ev.target.checked ? "CONFIRMED" : "TBA" })} />
            The dates are confirmed
          </label>
          {e.dateStatus === "CONFIRMED" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Starts</span>
                <input type="date" className={`${input} mt-1`} value={e.startsOn ?? ""} onChange={(ev) => update(i, { startsOn: ev.target.value || null })} />
              </label>
              <label className="block">
                <span className={label}>Ends</span>
                <input type="date" className={`${input} mt-1`} value={e.endsOn ?? ""} min={e.startsOn ?? undefined} onChange={(ev) => update(i, { endsOn: ev.target.value || null })} />
              </label>
            </div>
          )}
          <label className="block">
            <span className={label}>Recording link</span>
            <input className={`${input} mt-1`} value={e.recordingUrl ?? ""} placeholder="https://www.youtube.com/..." onChange={(ev) => update(i, { recordingUrl: ev.target.value || null })} />
          </label>
          <button type="button" className={secondary} onClick={() => setEditions(editions.filter((_, j) => j !== i))}>
            <X size={15} aria-hidden="true" /> Remove this edition
          </button>
        </fieldset>
      ))}
      <button type="button" className={secondary} onClick={() => setEditions([...editions, { label: "", theme: null, startsOn: null, endsOn: null, dateStatus: "TBA", summary: null, recordingUrl: null }])}>
        <Plus size={15} aria-hidden="true" /> Add an edition
      </button>
    </section>
  );
}
