"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Globe,
  Heart,
  HelpingHand,
  ImageIcon,
  Mountain,
  Phone,
  Play,
  Quote,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import type {
  SiteSectionName,
  SiteSettingsMap,
} from "@/lib/site-settings";

interface SectionRow {
  section: SiteSectionName;
  content: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

interface Props {
  initial: Record<SiteSectionName, SectionRow>;
}

interface FieldIssue {
  path: string;
  message: string;
}

const SECTION_META: Record<SiteSectionName, { label: string; description: string; icon: LucideIcon }> = {
  HERO: {
    label: "Hero",
    description: "Top-of-page headline, scripture badge, and CTA buttons.",
    icon: Play,
  },
  ABOUT: {
    label: "About",
    description: "Who-we-are paragraphs, gallery images, and pillar CTAs.",
    icon: Sparkles,
  },
  CULTURE: {
    label: "Culture",
    description: "The three pillar cards: Word, Spirit, Community.",
    icon: Mountain,
  },
  SCRIPTURE: {
    label: "Scripture",
    description: "Genesis 49 four-pillar identity + bottom quote.",
    icon: Quote,
  },
  SERVICE: {
    label: "Services",
    description: "Recurring schedule, location, and special-week banner.",
    icon: Globe,
  },
  SERMONS: {
    label: "Sermons",
    description: "Section header for the sermon strip (sermons themselves come from /dashboard/sermons).",
    icon: Play,
  },
  COMMUNITY: {
    label: "Community",
    description: "You-belong-here messaging and the visual welcome card.",
    icon: Users,
  },
  GIVING: {
    label: "Giving",
    description: "Homepage giving teaser — bank details live on /give.",
    icon: HelpingHand,
  },
  CONTACT: {
    label: "Contact",
    description: "Social channels, email, and visibility flags.",
    icon: Phone,
  },
};

const SECTION_ORDER: SiteSectionName[] = [
  "HERO",
  "ABOUT",
  "CULTURE",
  "SCRIPTURE",
  "SERVICE",
  "SERMONS",
  "COMMUNITY",
  "GIVING",
  "CONTACT",
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "Never edited";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tabbed homepage content editor.
 *
 * Edit strategy: each section's content is rendered as pretty-printed JSON in a
 * monospace textarea. Save POSTs the full content to PUT /site-settings/:section,
 * which Zod-validates on the backend. Field-level errors come back in the 400
 * response and are surfaced inline.
 *
 * Why JSON-first instead of bespoke form-per-field: nine sections × dozens of
 * fields each is a lot of UI to ship at once. The JSON view exposes every
 * editable field today; per-section friendly form widgets can land later
 * without changing the API surface or the Zod schemas.
 */
export default function SiteSettingsEditor({ initial }: Props) {
  const [active, setActive] = useState<SiteSectionName>("HERO");
  const [rows, setRows] = useState(initial);
  const [drafts, setDrafts] = useState<Record<SiteSectionName, string>>(() => {
    const out = {} as Record<SiteSectionName, string>;
    for (const s of SECTION_ORDER) {
      out[s] = JSON.stringify(initial[s]?.content ?? {}, null, 2);
    }
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<FieldIssue[]>([]);

  const meta = SECTION_META[active];
  const Icon = meta.icon;
  const currentRow = rows[active];
  const draft = drafts[active] ?? "";
  const isDirty =
    draft.trim() !==
    JSON.stringify(currentRow?.content ?? {}, null, 2).trim();

  function updateDraft(next: string) {
    setDrafts((prev) => ({ ...prev, [active]: next }));
    setParseError(null);
    setServerError(null);
    setFieldIssues([]);
    setSaved(false);
  }

  function resetDraft() {
    setDrafts((prev) => ({
      ...prev,
      [active]: JSON.stringify(currentRow?.content ?? {}, null, 2),
    }));
    setParseError(null);
    setServerError(null);
    setFieldIssues([]);
    setSaved(false);
  }

  function prettify() {
    try {
      const parsed = JSON.parse(draft);
      setDrafts((prev) => ({ ...prev, [active]: JSON.stringify(parsed, null, 2) }));
      setParseError(null);
    } catch (err) {
      setParseError((err as Error).message);
    }
  }

  async function save() {
    setSaved(false);
    setServerError(null);
    setFieldIssues([]);
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch (err) {
      setParseError(`Not valid JSON: ${(err as Error).message}`);
      return;
    }
    setParseError(null);
    setSaving(true);
    try {
      const res = await apiClient.put<SectionRow>(
        `/site-settings/${active.toLowerCase()}`,
        parsed,
      );
      setRows((prev) => ({ ...prev, [active]: res.data }));
      setDrafts((prev) => ({
        ...prev,
        [active]: JSON.stringify(res.data.content, null, 2),
      }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const e = err as {
        message?: string;
        details?: FieldIssue[];
        status?: number;
      };
      if (e.status === 400 && Array.isArray(e.details)) {
        setFieldIssues(e.details);
      }
      setServerError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#87102C]/80 mb-1.5">
            Admin · Site Settings
          </p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">Homepage</h1>
        </div>
        <p className="text-xs text-[#8a7e80] max-w-md sm:text-right">
          Edits go live within 5 minutes (or instantly for the editor — the public
          page revalidates on its own schedule).
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: easeOut }}
        className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6"
      >
        {/* Side rail */}
        <nav
          aria-label="Sections"
          className="bg-white border border-[#E7CDD3]/60 rounded-2xl p-3 h-fit sticky lg:top-24"
        >
          <ul className="space-y-1">
            {SECTION_ORDER.map((s) => {
              const m = SECTION_META[s];
              const TabIcon = m.icon;
              const isActive = s === active;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setActive(s)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#FFF4F6] text-[#87102C]"
                        : "text-[#5A4A4D] hover:bg-[#FFF4F6]/70 hover:text-[#87102C]"
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-[#87102C] text-white" : "bg-[#FFE8ED] text-[#87102C]"
                      }`}
                    >
                      <TabIcon size={15} />
                    </span>
                    <span className="flex-1 text-left">{m.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#87102C]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Editor pane */}
        <section
          aria-labelledby="section-editor-title"
          className="bg-white border border-[#E7CDD3]/60 rounded-2xl overflow-hidden"
        >
          <header className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#E7CDD3]/40 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-11 h-11 rounded-xl bg-[#FFE8ED] flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-[#87102C]" />
              </span>
              <div className="min-w-0">
                <h2
                  id="section-editor-title"
                  className="text-lg font-bold text-[#111] flex items-center gap-2"
                >
                  {meta.label}
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#87102C] bg-[#FFE8ED] px-2 py-0.5 rounded-full">
                    {active}
                  </span>
                </h2>
                <p className="text-xs text-[#8a7e80] mt-1 max-w-prose">
                  {meta.description}
                </p>
                <p className="text-[10px] text-[#8a7e80] mt-2 tracking-wide">
                  Last edited: {formatUpdatedAt(currentRow?.updatedAt ?? "")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={prettify}
                className="px-3 py-2 rounded-xl border border-[#E7CDD3] text-[#5A4A4D] text-xs font-semibold hover:bg-[#FFF4F6] transition-colors"
              >
                Format
              </button>
              <button
                type="button"
                onClick={resetDraft}
                disabled={!isDirty}
                className="px-3 py-2 rounded-xl border border-[#E7CDD3] text-[#5A4A4D] text-xs font-semibold hover:bg-[#FFF4F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset
              </button>
            </div>
          </header>

          <div className="p-6 sm:p-8 space-y-4">
            {parseError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">JSON couldn’t be parsed</p>
                  <p className="text-xs mt-0.5">{parseError}</p>
                </div>
              </div>
            )}

            {fieldIssues.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{fieldIssues.length} validation issue{fieldIssues.length === 1 ? "" : "s"}</p>
                    <ul className="text-xs mt-1.5 space-y-0.5">
                      {fieldIssues.map((iss, i) => (
                        <li key={i}>
                          <code className="font-mono text-[11px] bg-red-100 px-1 py-0.5 rounded">
                            {iss.path || "(root)"}
                          </code>{" "}
                          — {iss.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {serverError && fieldIssues.length === 0 && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {saved && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <Check size={16} className="flex-shrink-0 mt-0.5" />
                <span>Saved — public homepage refreshes within 5 minutes.</span>
              </div>
            )}

            <label
              htmlFor={`editor-${active}`}
              className="block text-xs font-semibold text-[#5A4A4D] tracking-wide"
            >
              Content (JSON)
            </label>
            <textarea
              id={`editor-${active}`}
              value={draft}
              onChange={(e) => updateDraft(e.target.value)}
              spellCheck={false}
              className="w-full font-mono text-[12.5px] leading-relaxed bg-[#FFF4F6]/40 border border-[#E7CDD3]/60 rounded-xl px-4 py-3.5 text-[#111] focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 transition-all min-h-[460px] resize-y"
            />

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[#8a7e80]">
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </p>
              <button
                type="button"
                onClick={save}
                disabled={!isDirty || saving}
                className="px-6 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold tracking-wide hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#87102C]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// Marker — keeps the type imported so TypeScript doesn't complain when this
// file is re-saved without referencing SiteSettingsMap.
type _typeReference = SiteSettingsMap;
