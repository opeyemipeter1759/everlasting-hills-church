"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  Globe,
  HelpingHand,
  Images,
  MessageSquareQuote,
  Mountain,
  Phone,
  Play,
  Quote,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import StructuredForm from "@/components/dashboard/admin/cms/structured/StructuredForm";
import { SITE_SETTINGS_FIELDS } from "./site-settings-fields";
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

const SECTION_META: Record<SiteSectionName, { label: string; icon: LucideIcon }> = {
  HERO: { label: "Hero", icon: Play },
  ABOUT: { label: "About", icon: Sparkles },
  CULTURE: { label: "Culture", icon: Mountain },
  SCRIPTURE: { label: "Scripture", icon: Quote },
  SERVICE: { label: "Services", icon: Globe },
  SERMONS: { label: "Sermons", icon: Play },
  TESTIMONIALS: { label: "Testimonials", icon: MessageSquareQuote },
  COMMUNITY: { label: "Community", icon: Users },
  GIVING: { label: "Giving", icon: HelpingHand },
  CONTACT: { label: "Contact", icon: Phone },
  CAROUSEL: { label: "Carousel", icon: Images },
};

const SECTION_ORDER: SiteSectionName[] = [
  "HERO",
  "ABOUT",
  "CULTURE",
  "SCRIPTURE",
  "SERVICE",
  "SERMONS",
  "TESTIMONIALS",
  "COMMUNITY",
  "GIVING",
  "CONTACT",
  "CAROUSEL",
];

/**
 * Tabbed homepage content editor. Each section renders as a proper field-driven
 * form (StructuredForm — the same one CMS pages use), not raw JSON. Save PUTs the
 * full section content to /site-settings/:section, which Zod-validates on the
 * backend; field-level errors come back in the 400 response and surface inline.
 */
export default function SiteSettingsEditor({ initial }: Props) {
  const [active, setActive] = useState<SiteSectionName>("HERO");
  const [rows, setRows] = useState(initial);
  const [drafts, setDrafts] = useState<Record<SiteSectionName, unknown>>(() => {
    const out = {} as Record<SiteSectionName, unknown>;
    for (const s of SECTION_ORDER) out[s] = initial[s]?.content ?? {};
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<FieldIssue[]>([]);

  const meta = SECTION_META[active];
  const currentRow = rows[active];
  const draft = drafts[active];
  const isDirty = JSON.stringify(draft) !== JSON.stringify(currentRow?.content ?? {});

  function updateDraft(next: unknown) {
    setDrafts((prev) => ({ ...prev, [active]: next }));
    setServerError(null);
    setFieldIssues([]);
    setSaved(false);
  }

  function resetDraft() {
    setDrafts((prev) => ({ ...prev, [active]: currentRow?.content ?? {} }));
    setServerError(null);
    setFieldIssues([]);
    setSaved(false);
  }

  async function save(): Promise<boolean> {
    setSaved(false);
    setServerError(null);
    setFieldIssues([]);
    setSaving(true);
    try {
      const res = await apiClient.put<SectionRow>(
        `/site-settings/${active.toLowerCase()}`,
        draft,
      );
      setRows((prev) => ({ ...prev, [active]: res.data }));
      setDrafts((prev) => ({ ...prev, [active]: res.data.content }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
      return true;
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
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function doPreview() {
    if (isDirty) {
      const ok = await save();
      if (!ok) return;
    }
    window.open("/", "_blank");
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/cms"
            className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{meta.label}</h1>
            <p className="text-xs text-gray-400 font-mono">Homepage · {active}</p>
          </div>
          {isDirty && <span className="text-[10px] font-semibold text-gray-400">Unsaved</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <Check size={14} /> Saved
            </span>
          )}
          <button type="button" onClick={doPreview} className={tbBtn}>
            <Eye size={15} /> Live preview
          </button>
          <button type="button" onClick={resetDraft} disabled={!isDirty} className={tbBtn}>
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#87102C] text-white text-sm font-bold hover:bg-[#6E0C24] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Section nav */}
        <nav aria-label="Sections" className="w-56 flex-shrink-0 space-y-1">
          {SECTION_ORDER.map((s) => {
            const m = SECTION_META[s];
            const TabIcon = m.icon;
            const isActive = s === active;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActive(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#FFF4F6] text-[#87102C]"
                    : "text-[#5A4A4D] hover:bg-[#FFF4F6]/70 hover:text-[#87102C]"
                }`}
              >
                <TabIcon size={15} className="flex-shrink-0" />
                {m.label}
              </button>
            );
          })}
        </nav>

        {/* Editor */}
        <div className="flex-1 min-w-0 space-y-4">
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

          <StructuredForm fields={SITE_SETTINGS_FIELDS[active]} value={draft} onChange={updateDraft} />
        </div>
      </div>
    </div>
  );
}

const tbBtn =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7CDD3] bg-white text-sm font-semibold text-gray-700 hover:bg-[#FFF4F6] transition-colors disabled:opacity-50";

/* eslint-disable @typescript-eslint/no-unused-vars */
// Marker — keeps the type imported so TypeScript doesn't complain when this
// file is re-saved without referencing SiteSettingsMap.
type _typeReference = SiteSettingsMap;
