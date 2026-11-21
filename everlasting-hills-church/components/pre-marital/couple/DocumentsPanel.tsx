"use client";

import { useState } from "react";
import type { ApiError } from "@/lib/api/axios";
import { downloadLetter, type CoupleOverview } from "@/lib/api/couple";
import { DocumentCard } from "./DocumentCard";
import { button, muted, Panel } from "./parts";

/** This partner's two letters to download, and their two documents to upload. Everything is done here, on the website. */
export function DocumentsPanel({ data, onChanged }: { data: CoupleOverview; onChanged: () => void }) {
  const { documents: d, application: a } = data;
  const [problem, setProblem] = useState<string | null>(null);
  const letter = (which: "consent" | "medical") => {
    setProblem(null);
    downloadLetter(which).catch((e: ApiError) => setProblem(e.message || "The letter could not be downloaded. Please try again."));
  };
  return (
    <Panel id="pmc-documents" title="Your documents">
      <ol className={`list-decimal space-y-1 pl-5 text-sm leading-relaxed ${muted}`}>
        <li>Download your two letters below.</li>
        <li>
          Ask one of your parents, either your father or your mother, or a recognised guardian, to sign the consent letter.
        </li>
        <li>Do the medical tests listed in your medical letter.</li>
        <li>
          Upload the signed letter and your medical certificate here{d.neededBefore ? `, ${d.neededBefore}` : ""}. PDF, JPG or PNG, up to{" "}
          {d.maxUploadMb} MB each.
        </li>
      </ol>
      <p className={`mt-2 text-sm ${muted}`}>Your documents are kept securely and seen only by the pastorate.</p>
      {d.lettersAvailable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => letter("consent")}>
            Download your consent letter
          </button>
          <button type="button" className={button} onClick={() => letter("medical")}>
            Download your medical letter
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
          Online uploads are not open yet. Please bring your documents to the church office for now.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {d.items.map((doc) => (
          <li key={doc.kind}>
            <DocumentCard
              doc={d.uploadsOpen ? doc : { ...doc, canUpload: false }}
              consentWording={d.medicalConsentWording}
              maxMb={d.maxUploadMb}
              onChanged={onChanged}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
