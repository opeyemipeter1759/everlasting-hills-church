"use client";

import { useState } from "react";
import type { ApiError } from "@/lib/api/axios";
import { downloadLetter, type CoupleDocument, type CoupleOverview } from "@/lib/api/couple";
import { DocumentCard } from "./DocumentCard";
import { button, muted, Panel } from "./parts";

/** The two letters to download, and each document's status, with upload where this partner may. */
export function DocumentsPanel({ data, onChanged }: { data: CoupleOverview; onChanged: () => void }) {
  const { documents: d, application: a } = data;
  const [problem, setProblem] = useState<string | null>(null);
  const letter = (which: "consent" | "medical") => {
    setProblem(null);
    downloadLetter(which).catch((e: ApiError) => setProblem(e.message || "The letter could not be downloaded. Please try again."));
  };
  const noteFor = (doc: CoupleDocument) =>
    doc.yours ? undefined : `${a.partner.firstName} uploads this one on their own dashboard.`;
  return (
    <Panel id="pmc-documents" title="Documents">
      <p className={`text-sm leading-relaxed ${muted}`}>
        We need the signed parental consent letter and a medical certificate from each of you
        {d.neededBefore ? `, ${d.neededBefore}` : ""}. Upload them here, or bring them to the church office. Uploaded documents are kept
        securely and seen only by the pastorate. PDF, JPG or PNG, up to {d.maxUploadMb} MB each.
      </p>
      {d.lettersAvailable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => letter("consent")}>
            Download the consent letter
          </button>
          <button type="button" className={button} onClick={() => letter("medical")}>
            Download the medical letter
          </button>
        </div>
      )}
      {problem && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {problem}
        </p>
      )}
      {!d.uploadsOpen && !a.closed && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
          Uploading opens soon. Until then, please bring your documents to the church office.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {d.items.map((doc) => (
          <li key={doc.kind}>
            <DocumentCard
              doc={d.uploadsOpen ? doc : { ...doc, canUpload: false }}
              consentWording={d.medicalConsentWording}
              maxMb={d.maxUploadMb}
              note={noteFor(doc)}
              onChanged={onChanged}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
