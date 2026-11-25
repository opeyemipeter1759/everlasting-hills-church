"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { ProgramDraft } from "./useProgramDraft";
import { card, hint, input, label, sectionTitle, selectBox, TYPE_OPTIONS } from "./ui";

/** Paragraphs separated by a blank line, stored as simple HTML (the API cleans it again before saving). */
export const toHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`)
    .join("");
export const toText = (html: string | null) =>
  (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

/** Name, address, the short and long description, and what kind of meeting it is. */
export function BasicsSection({ draft, generatedEyebrow }: { draft: ProgramDraft; generatedEyebrow: string }) {
  const { fields: f, set } = draft;
  // Typed text is kept as typed (blank lines included); the HTML is derived from it, never the other way round.
  const [story, setStory] = useState(() => toText(f.longDescription));
  return (
    <section id="basics" className={`${card} space-y-4`} aria-labelledby="basics-title">
      <h2 id="basics-title" className={sectionTitle}>Basics</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Name</span>
          <input className={`${input} mt-1`} value={f.name} maxLength={80} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>Web address</span>
          <input className={`${input} mt-1`} value={f.slug} maxLength={60} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
          <span className={hint}>everlastinghills.church/programs/{f.slug || "…"}</span>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#111] dark:text-white/85">
        <input type="checkbox" checked={f.nameStatus === "PROVISIONAL"} onChange={(e) => set("nameStatus", e.target.checked ? "PROVISIONAL" : "FINAL")} className="h-4 w-4 accent-[#87102C]" />
        This is a working name (the page says it is still to be confirmed)
      </label>
      <label className="block">
        <span className={label}>Line above the name</span>
        <input className={`${input} mt-1`} value={f.eyebrow ?? ""} placeholder={generatedEyebrow} maxLength={80} onChange={(e) => set("eyebrow", e.target.value || null)} />
        <span className={hint}>Leave empty to use the one made from the schedule: {generatedEyebrow}</span>
      </label>
      <label className="block">
        <span className={label}>Short description</span>
        <textarea className={`${input} mt-1 py-2`} rows={3} maxLength={280} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        <span className={hint}>{f.shortDescription.length} of 280. Shown on the card.</span>
      </label>
      <label className="block">
        <span className={label}>The story</span>
        <textarea className={`${input} mt-1 py-2`} rows={7} value={story} onChange={(e) => { setStory(e.target.value); set("longDescription", e.target.value.trim() ? toHtml(e.target.value) : null); }} />
        <span className={hint}>Shown on the program&apos;s page. Leave a blank line between paragraphs.</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={label} id="type-label">Kind of meeting</span>
          <div className="mt-1">
            <Select value={f.programType} onChange={(v) => set("programType", v as typeof f.programType)} options={TYPE_OPTIONS} aria-labelledby="type-label" className={selectBox} />
          </div>
        </div>
      </div>
    </section>
  );
}
