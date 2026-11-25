"use client";

import { useState } from "react";
import Image from "next/image";
import { Select } from "@/components/ui/select";
import type { ApiError } from "@/lib/api/axios";
import { uploadProgramImage } from "@/lib/api/programs-admin";
import type { ProgramDraft } from "./useProgramDraft";
import { ACCENT_OPTIONS, card, FORMAT_OPTIONS, hint, input, label, secondary, sectionTitle, selectBox } from "./ui";

function ImageField({ title, value, onChange, note }: { title: string; value: string | null; onChange: (url: string | null) => void; note: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <div>
      <span className={label}>{title}</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        {value && <Image src={value} alt="" width={160} height={56} className="h-14 w-auto max-w-[10rem] rounded-lg border border-gray-200 object-contain dark:border-white/10" />}
        <label className={`${secondary} cursor-pointer`}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setProblem(null);
              try {
                onChange(await uploadProgramImage(file));
              } catch (err) {
                setProblem((err as ApiError).message || "The image did not upload. Try a smaller file.");
              } finally {
                setBusy(false);
              }
            }} />
        </label>
        {value && <button type="button" className={secondary} onClick={() => onChange(null)}>Remove</button>}
      </div>
      <p className={hint}>{note}</p>
      {problem && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{problem}</p>}
    </div>
  );
}

/** Logo, cover and accent; where it happens; and the one thing the page asks people to do. */
export function MediaCtaSection({ draft }: { draft: ProgramDraft }) {
  const { fields: f, set } = draft;
  return (
    <>
      <section id="media" className={`${card} space-y-4`} aria-labelledby="media-title">
        <h2 id="media-title" className={sectionTitle}>Media</h2>
        <ImageField title="Logo" value={f.logoUrl} onChange={(v) => set("logoUrl", v)} note="Without a logo, the card shows the name in large type on the accent colour." />
        <ImageField title="Cover image" value={f.coverUrl} onChange={(v) => set("coverUrl", v)} note="Used when the program is shared." />
        <div>
          <span className={label} id="accent-label">Accent colour</span>
          <div className="mt-1 max-w-xs">
            <Select value={f.accent} onChange={(v) => set("accent", v as typeof f.accent)} options={ACCENT_OPTIONS} aria-labelledby="accent-label" className={selectBox} />
          </div>
        </div>
      </section>
      <section id="cta" className={`${card} space-y-4`} aria-labelledby="cta-title">
        <h2 id="cta-title" className={sectionTitle}>Where and call to action</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className={label} id="format-label">Format</span>
            <div className="mt-1">
              <Select value={f.format} onChange={(v) => set("format", v as typeof f.format)} options={FORMAT_OPTIONS} aria-labelledby="format-label" className={selectBox} />
            </div>
          </div>
          <label className="block">
            <span className={label}>Venue</span>
            <input className={`${input} mt-1`} value={f.venue ?? ""} maxLength={200} onChange={(e) => set("venue", e.target.value || null)} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Stream link</span>
          <input className={`${input} mt-1`} value={f.streamUrl ?? ""} placeholder="https://www.youtube.com/@everlastinghillschurch" onChange={(e) => set("streamUrl", e.target.value || null)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Button text</span>
            <input className={`${input} mt-1`} value={f.ctaLabel ?? ""} maxLength={40} placeholder="Join a watch" onChange={(e) => set("ctaLabel", e.target.value || null)} />
          </label>
          <label className="block">
            <span className={label}>Button link</span>
            <input className={`${input} mt-1`} value={f.ctaUrl ?? ""} placeholder="/prayer-watch" onChange={(e) => set("ctaUrl", e.target.value || null)} />
            <span className={hint}>A page on this site (starting with /) or an https:// link.</span>
          </label>
        </div>
      </section>
    </>
  );
}
