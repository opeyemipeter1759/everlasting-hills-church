"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import type { SiteSectionName } from "@/lib/site-settings";
import { SECTION_META, SECTION_ORDER } from "./site-settings-sections";
import SiteSettingsFormPanel, { type FieldIssue } from "./SiteSettingsFormPanel";
import SiteSettingsSectionNav from "./SiteSettingsSectionNav";
import SiteSettingsToolbar from "./SiteSettingsToolbar";

interface SectionRow {
  section: SiteSectionName;
  content: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

interface Props {
  initial: Record<SiteSectionName, SectionRow>;
}

export default function SiteSettingsEditor({ initial }: Props) {
  const [active, setActive] = useState<SiteSectionName>("HERO");
  const [rows, setRows] = useState(initial);
  const [drafts, setDrafts] = useState<Record<SiteSectionName, unknown>>(() => {
    const out = {} as Record<SiteSectionName, unknown>;
    for (const section of SECTION_ORDER) out[section] = initial[section]?.content ?? {};
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<FieldIssue[]>([]);

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
      const res = await apiClient.put<SectionRow>(`/site-settings/${active.toLowerCase()}`, draft);
      setRows((prev) => ({ ...prev, [active]: res.data }));
      setDrafts((prev) => ({ ...prev, [active]: res.data.content }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error) {
      const details = error as { message?: string; details?: FieldIssue[]; status?: number };
      if (details.status === 400 && Array.isArray(details.details)) setFieldIssues(details.details);
      setServerError(details.message ?? "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function doPreview() {
    if (isDirty && !(await save())) return;
    window.open("/", "_blank");
  }

  return (
    <div>
      <SiteSettingsToolbar
        label={SECTION_META[active].label}
        active={active}
        isDirty={isDirty}
        saved={saved}
        saving={saving}
        onPreview={doPreview}
        onReset={resetDraft}
        onSave={save}
      />
      <div className="flex gap-6">
        <SiteSettingsSectionNav active={active} onSelect={setActive} />
        <SiteSettingsFormPanel
          active={active}
          draft={draft}
          fieldIssues={fieldIssues}
          serverError={serverError}
          onChange={updateDraft}
        />
      </div>
    </div>
  );
}
