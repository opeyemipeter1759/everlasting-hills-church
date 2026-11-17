"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useOpeningTemplate, useSaveOpeningTemplate } from "@/lib/api/opening-message";
import { draftProblems, type TemplateDraft } from "@/lib/messages/opening-template";
import { TemplateFields } from "./TemplateFields";
import { TemplatePreview } from "./TemplatePreview";
import { VersionHistory } from "./VersionHistory";

const EMPTY: TemplateDraft = { whatsappBody: "", emailSubject: "", emailBody: "" };
const words = (v: TemplateDraft): TemplateDraft => ({ whatsappBody: v.whatsappBody, emailSubject: v.emailSubject, emailBody: v.emailBody });

/**
 * The opening message editor: write it, see it filled in for a real
 * first-timer, and save. Every save is a new version that is used from the
 * next send on; any old version can be brought back in one tap.
 */
export default function OpeningTemplateEditor() {
  const history = useOpeningTemplate();
  const save = useSaveOpeningTemplate();
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const active = history.data?.active ?? null;

  useEffect(() => {
    if (history.data && draft === null) setDraft(history.data.active ? words(history.data.active) : EMPTY);
  }, [history.data, draft]);

  if (history.isError) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-gray-500 dark:text-white/50">The message could not be loaded. Check your connection and try again.</p>;
  }
  if (!history.data || !draft) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading" />;

  const problems = draftProblems(draft, history.data.church);
  const changed = !active || JSON.stringify(words(active)) !== JSON.stringify(words(draft));

  async function onSave() {
    try {
      const saved = await save.mutateAsync(draft as TemplateDraft);
      showToast.success(`Saved as version ${saved.version}. Every message from now on uses it.`);
      setDraft(words(saved));
    } catch (err) {
      showToast.error((err as ApiError)?.message || "Could not save the message");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
      <Link href="/dashboard/first-timers" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#111] dark:text-white/55 dark:hover:text-white">
        <ArrowLeft size={15} aria-hidden="true" /> Welcome queue
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-[#111] dark:text-white">Opening message</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-white/60">
          What a first-timer gets from you after their first visit. {active ? `Version ${active.version} is in use.` : "Nothing is saved yet."} Changes apply from the next message you send.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5" aria-label="Edit the message">
          <TemplateFields draft={draft} onChange={setDraft} church={history.data.church} />
          {problems.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 rounded-xl bg-red-50 py-3 pl-8 pr-4 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300" role="alert">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={!changed || problems.length > 0 || save.isPending}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-50"
            >
              {save.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              Save as a new version
            </button>
            {changed && active && (
              <button type="button" onClick={() => setDraft(words(active))} className="text-sm font-medium text-gray-600 hover:text-[#111] dark:text-white/60 dark:hover:text-white">
                Undo my changes
              </button>
            )}
            {!changed && <span className="text-sm text-gray-500 dark:text-white/45">No changes to save</span>}
          </div>
        </section>
        <div className="space-y-4">
          <TemplatePreview draft={draft} />
          <VersionHistory versions={history.data.versions} onReverted={(v) => setDraft(words(v))} />
        </div>
      </div>
    </div>
  );
}
