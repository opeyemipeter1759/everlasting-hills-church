"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { CaseDetail } from "@/lib/api/premarital";
import { DeleteCasesDialog, danger } from "../DeleteCases";
import { card, input, lagosDate, primary, secondary, useRun } from "../ui";

/** Logistics note, safeguarding, archive, deletion and wedding approval, each for the roles allowed to use it. */
export function AdminPanel({ c }: { c: CaseDetail }) {
  const { run, pending } = useRun();
  const [note, setNote] = useState(c.adminNote ?? "");
  const [confirm, setConfirm] = useState<"archive" | "safeguarding" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const flagged = !!c.safeguardingFlaggedAt;
  if (!c.can.admin && !c.can.safeguarding && !c.can.archive && !c.can.delete && !c.can.wedding && !c.WeddingApproval) return null;

  return (
    <section aria-labelledby="admin-heading" className={`${card} space-y-4`}>
      <h2 id="admin-heading" className="text-base font-bold text-[#111] dark:text-white">For the team</h2>
      {c.can.admin && (
        <div className="space-y-2">
          <label htmlFor="admin-note" className="block text-sm font-semibold text-[#111] dark:text-white/90">Logistics note</label>
          <p className="text-xs text-amber-800 dark:text-amber-200">For arrangements only, like the best time to call. Never record anything the couple disclosed.</p>
          <textarea id="admin-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={`${input} py-2`} />
          <button type="button" className={secondary} disabled={pending || note === (c.adminNote ?? "")} onClick={() => run("patch", `/premarital/applications/${c.id}/admin`, { adminNote: note.trim() || null }, "Note saved")}>
            Save note
          </button>
        </div>
      )}

      {c.WeddingApproval ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">Wedding approved on {lagosDate(c.WeddingApproval.approvedAt)}.</p>
      ) : (
        c.can.wedding && (
          <button type="button" className={primary} disabled={pending} onClick={() => run("post", `/premarital/applications/${c.id}/wedding-approval`, {}, "Wedding approved")}>
            Approve the wedding
          </button>
        )
      )}

      {(c.can.safeguarding || c.can.archive || c.can.delete) && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          {c.can.safeguarding && (
            <button type="button" className={secondary} disabled={pending} onClick={() => setConfirm("safeguarding")}>
              {flagged ? "Clear the safeguarding concern" : "Raise a safeguarding concern"}
            </button>
          )}
          {c.can.archive && !c.archivedAt && (
            <button type="button" className={secondary} disabled={pending} onClick={() => setConfirm("archive")}>
              Archive
            </button>
          )}
          {c.can.delete && (
            <button type="button" className={danger} disabled={pending} onClick={() => setDeleting(true)}>
              Delete for good
            </button>
          )}
        </div>
      )}

      <DeleteCasesDialog ids={[c.id]} open={deleting} onClose={() => setDeleting(false)} onDeleted={() => router.replace("/dashboard/marriage/applications")} />
      <ConfirmDialog
        open={confirm !== null}
        tone={confirm === "archive" ? "warning" : "danger"}
        title={confirm === "archive" ? "Archive this case?" : flagged ? "Clear the safeguarding concern?" : "Raise a safeguarding concern?"}
        description={
          confirm === "archive"
            ? "It leaves every list. It is kept until the retention period ends, then deleted by the pastors' process."
            : flagged
              ? "The case returns to the marriage ministry team and its counsellors."
              : "Only the pastors will be able to see this case. No details are stored with the flag; handle the concern in person."
        }
        confirmLabel={confirm === "archive" ? "Archive" : flagged ? "Clear it" : "Raise it"}
        loading={pending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm === "archive") await run("post", `/premarital/applications/${c.id}/archive`, {}, "Case archived");
          else await run("post", `/premarital/applications/${c.id}/safeguarding`, { raised: !flagged }, flagged ? "Concern cleared" : "Concern raised");
          setConfirm(null);
        }}
      />
    </section>
  );
}
