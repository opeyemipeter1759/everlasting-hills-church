"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useProgramAction, type AdminProgram } from "@/lib/api/programs-admin";
import type { ProgramDraft } from "./useProgramDraft";
import { card, danger, primary, secondary, sectionTitle, STATUS_CHIP } from "./ui";

type Act = "publish" | "unpublish" | "archive" | "delete";
const DONE: Record<Act, string> = { publish: "Published", unpublish: "Moved back to draft", archive: "Archived", delete: "Deleted" };

/** Who can see it: publish, unpublish, archive or delete; whether it is featured; and what still needs attention. */
export function VisibilityPanel({ draft }: { draft: ProgramDraft }) {
  const router = useRouter();
  const action = useProgramAction();
  const [confirm, setConfirm] = useState<Act | null>(null);
  const p = draft.base;
  const run = async (act: Act) => {
    try {
      if (act === "delete") {
        await action.mutateAsync({ method: "delete", path: `/programs/${p.id}` });
        showToast.success(DONE.delete);
        router.replace("/dashboard/admin/programs");
        return;
      }
      draft.setBase((await action.mutateAsync({ method: "post", path: `/programs/${p.id}/${act}` })) as AdminProgram);
      showToast.success(DONE[act]);
    } catch (e) {
      showToast.error((e as ApiError).message || "That did not go through. Try again.");
    } finally {
      setConfirm(null);
    }
  };
  return (
    <section id="visibility" className={`${card} space-y-4`} aria-labelledby="visibility-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="visibility-title" className={sectionTitle}>Visibility</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[p.status].cls}`}>{STATUS_CHIP[p.status].label}</span>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#111] dark:text-white/85">
        <input type="checkbox" className="h-4 w-4 accent-[#87102C]" checked={draft.fields.featured} onChange={(e) => draft.set("featured", e.target.checked)} />
        Featured
      </label>
      {p.attention.length > 0 && (
        <ul className="space-y-1.5">
          {p.attention.map((a) => (
            <li key={a} className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
              <AlertTriangle size={14} aria-hidden="true" /> {a}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {p.status !== "PUBLISHED" && <button type="button" className={primary} disabled={draft.dirty || action.isPending} onClick={() => run("publish")}>Publish</button>}
        {p.status === "PUBLISHED" && <button type="button" className={secondary} disabled={action.isPending} onClick={() => run("unpublish")}>Move back to draft</button>}
        {p.status !== "ARCHIVED" && <button type="button" className={secondary} disabled={action.isPending} onClick={() => setConfirm("archive")}>Archive</button>}
        {p.status !== "PUBLISHED" && <button type="button" className={danger} disabled={action.isPending} onClick={() => setConfirm("delete")}>Delete</button>}
      </div>
      {draft.dirty && p.status !== "PUBLISHED" && <p className="text-xs text-gray-600 dark:text-white/55">Save your changes before publishing.</p>}
      <ConfirmDialog
        open={confirm !== null}
        tone={confirm === "delete" ? "danger" : "warning"}
        title={confirm === "delete" ? `Delete ${p.name}?` : `Archive ${p.name}?`}
        description={confirm === "delete" ? "It is removed for good, with its scriptures, sessions and editions." : "It leaves the public page. You can publish it again later."}
        confirmLabel={confirm === "delete" ? "Delete" : "Archive"}
        loading={action.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => (confirm ? run(confirm) : undefined)}
      />
    </section>
  );
}
