"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { downloadLetter, useCaseDocuments } from "@/lib/api/marriage-documents";
import type { CaseDetail } from "@/lib/api/premarital";
import { card, lagosDate, secondary, useRun } from "../ui";
import { DocumentRow } from "./DocumentRow";
import { SignInsLine } from "./SignInsLine";

/** The consent letter and medical certificates for this case: status, review, the couple's dashboard sign-ins and the letters. */
export function DocumentsPanel({ c }: { c: CaseDetail }) {
  const q = useCaseDocuments(c.id);
  const qc = useQueryClient();
  const { run, pending } = useRun();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const d = q.data;
  if (!d) return null;
  const lastSend = d.dispatches[0];
  const letter = (which: "consent" | "medical") => downloadLetter(c.id, which).catch((e: ApiError) => showToast.error(e.message || "The letter could not be made."));

  return (
    <section aria-labelledby="documents-heading" className={card}>
      <h2 id="documents-heading" className="text-base font-bold text-[#111] dark:text-white">Documents</h2>
      {d.can.setRole && (
        <div className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
          <p className="font-semibold">Role not set: who applied?</p>
          <p className="mt-0.5">This application came in before the form asked. The letters need to know who is the groom and who is the bride.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={secondary} disabled={pending} onClick={() => run("patch", `/premarital/applications/${c.id}/role`, { applicantRole: "GROOM" }, `${c.applicantFirstName} is the intending groom`)}>
              {c.applicantFirstName} is the intending groom
            </button>
            <button type="button" className={secondary} disabled={pending} onClick={() => run("patch", `/premarital/applications/${c.id}/role`, { applicantRole: "BRIDE" }, `${c.applicantFirstName} is the intending bride`)}>
              {c.applicantFirstName} is the intending bride
            </button>
          </div>
        </div>
      )}
      {d.requirements.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-white/60">No documents have been sent to this couple yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {d.requirements.map((r) => (
            <DocumentRow key={r.id} r={r} validFrom={d.validFrom} />
          ))}
        </ul>
      )}
      <SignInsLine accounts={d.accounts} />
      {lastSend && (
        <p className="mt-1 text-xs text-gray-600 dark:text-white/55">
          {`Letters email ${lastSend.status === "SENT" ? "sent" : lastSend.status === "FAILED" ? "failed" : "held back by today's email limit"} on ${lagosDate(lastSend.sentAt)}.`}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {d.can.send && (
          <button type="button" className={secondary} disabled={pending} onClick={() => run("post", `/premarital/applications/${c.id}/documents/send`, {}, "Letters sent")}>
            {d.dispatches.length ? "Resend documents" : "Send documents"}
          </button>
        )}
        {d.can.resendSignIn && (
          <button type="button" className={secondary} disabled={pending} onClick={() => run("post", `/premarital/applications/${c.id}/sign-in`, {}, "Sign-in details sent to both partners")}>
            Resend sign-in details
          </button>
        )}
        {d.can.downloadLetters && (
          <>
            <button type="button" className={secondary} onClick={() => letter("consent")}>Consent letter</button>
            <button type="button" className={secondary} onClick={() => letter("medical")}>Medical letter</button>
          </>
        )}
        {d.can.deleteStored && (
          <button type="button" className={`${secondary} text-red-700 dark:text-red-300`} onClick={() => setConfirmDelete(true)}>
            Delete stored documents
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title="Delete this couple's stored documents?"
        description={`This deletes the ${d.storedFiles} stored file${d.storedFiles === 1 ? "" : "s"} for good. The checklist and who accepted what stay on the case. It cannot be undone.`}
        confirmLabel="Delete stored documents"
        loading={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (await run("post", `/premarital/applications/${c.id}/documents/delete-stored`, {}, "Stored documents deleted")) {
            setConfirmDelete(false);
            await qc.invalidateQueries({ queryKey: ["marriage"] });
          }
        }}
      />
    </section>
  );
}
