"use client";

import { ProgramCard } from "@/components/programs/ProgramCard";
import type { ProgramCard as Card } from "@/lib/programs";
import type { SchedulePreview } from "./ScheduleSection";
import type { ProgramDraft } from "./useProgramDraft";

/** The card as the public Programs page will show it, built from what is on the form right now. */
export function CardPreview({ draft, preview }: { draft: ProgramDraft; preview: SchedulePreview }) {
  const f = draft.fields;
  const card: Card = {
    slug: f.slug,
    name: f.name || "Untitled program",
    nameStatus: f.nameStatus,
    eyebrow: f.eyebrow?.trim() || preview?.eyebrow || "",
    shortDescription: f.shortDescription || "The short description appears here.",
    programType: f.programType,
    cadence: f.cadence,
    format: f.format,
    accent: f.accent,
    logoUrl: f.logoUrl,
    coverUrl: f.coverUrl,
    ctaLabel: f.ctaLabel,
    ctaUrl: f.ctaUrl,
    featured: f.featured,
    dateStatus: f.dateStatus,
    schedule: preview?.schedule ?? "",
    nextOccurrence: preview?.next[0] ? { ...preview.next[0], label: null } : null,
    isLiveNow: false,
    liveSession: null,
    occurrences: (preview?.next ?? []).map((n) => ({ ...n, label: null, sessions: [] })),
    scriptures: draft.scriptures.map((s) => ({ reference: s.reference, text: null, translation: null, status: s.status })),
  };
  return (
    <figure aria-label="Preview of the public card">
      {/* inert: the preview's link is not a real way off this page, so it is kept out of the tab order. */}
      <div className="pointer-events-none rounded-[28px] bg-[#080808] p-4" {...({ inert: "" } as object)}>
        <ProgramCard program={card} now={new Date()} />
      </div>
      <figcaption className="mt-2 text-xs text-gray-600 dark:text-white/55">How the card looks on the public Programs page.</figcaption>
    </figure>
  );
}
