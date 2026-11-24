"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useProgram, type AdminProgram } from "@/lib/api/programs-admin";
import { BasicsSection } from "./BasicsSection";
import { CardPreview } from "./CardPreview";
import { EditionsSection } from "./EditionsSection";
import { MediaCtaSection } from "./MediaCtaSection";
import { ScheduleSection, type SchedulePreview } from "./ScheduleSection";
import { ScriptureSection } from "./ScriptureSection";
import { SessionsSection } from "./SessionsSection";
import { useProgramDraft } from "./useProgramDraft";
import { VisibilityPanel } from "./VisibilityPanel";
import { primary, secondary } from "./ui";

const SECTIONS = [
  ["basics", "Basics"],
  ["schedule", "Schedule"],
  ["scripture", "Scripture"],
  ["sessions", "Sessions"],
  ["editions", "Editions"],
  ["media", "Media"],
  ["cta", "Call to action"],
  ["visibility", "Visibility"],
] as const;

/** Loads one program, then hands it to the form. */
export default function ProgramEditorClient({ id }: { id: string }) {
  const q = useProgram(id);
  if (q.isLoading) return <p className="px-6 py-8 text-sm text-gray-600 dark:text-white/60">Loading the program…</p>;
  if (q.error || !q.data) return <p className="px-6 py-8 text-sm text-red-700 dark:text-red-300">This program could not be loaded. It may have been deleted.</p>;
  return <ProgramForm key={q.data.id} program={q.data} />;
}

function ProgramForm({ program }: { program: AdminProgram }) {
  const router = useRouter();
  const draft = useProgramDraft(program);
  const [preview, setPreview] = useState<SchedulePreview>(null);
  const [leaving, setLeaving] = useState(false);
  const back = () => (draft.dirty ? setLeaving(true) : router.push("/dashboard/admin/programs"));
  const save = async () => {
    try {
      await draft.save();
      showToast.success("Saved");
    } catch (e) {
      showToast.error((e as ApiError).message || "That did not save. Check the highlighted fields and try again.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={secondary} onClick={back}>
          <ArrowLeft size={15} aria-hidden="true" /> Programs
        </button>
        <div className="flex items-center gap-3">
          {draft.dirty && <span className="text-sm text-amber-800 dark:text-amber-200">Unsaved changes</span>}
          <button type="button" className={primary} disabled={!draft.dirty || draft.saving} onClick={save}>
            {draft.saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-[#111] dark:text-white">{draft.fields.name || "Untitled program"}</h1>
      <nav aria-label="Sections" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {SECTIONS.map(([anchor, title]) => (
          <a key={anchor} href={`#${anchor}`} className="text-gray-600 hover:text-[#87102C] dark:text-white/60 dark:hover:text-white">
            {title}
          </a>
        ))}
      </nav>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <BasicsSection draft={draft} generatedEyebrow={preview?.eyebrow ?? program.generatedEyebrow} />
          <ScheduleSection draft={draft} onPreview={setPreview} />
          <ScriptureSection draft={draft} />
          <SessionsSection draft={draft} />
          <EditionsSection draft={draft} />
          <MediaCtaSection draft={draft} />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <CardPreview draft={draft} preview={preview} />
          <VisibilityPanel draft={draft} />
        </aside>
      </div>
      <ConfirmDialog
        open={leaving}
        tone="warning"
        title="Leave without saving?"
        description="Your changes to this program will be lost."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onCancel={() => setLeaving(false)}
        onConfirm={() => router.push("/dashboard/admin/programs")}
      />
    </div>
  );
}
