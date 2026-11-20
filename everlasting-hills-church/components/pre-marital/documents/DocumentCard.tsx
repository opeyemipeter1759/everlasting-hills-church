"use client";

import { useRef, useState } from "react";
import type { ApiError } from "@/lib/api/axios";
import {
  REASON_WORDS,
  recordConsent,
  STATUS_WORDS,
  uploadDocument,
  type CoupleDocument,
} from "@/lib/api/premarital-documents";

const ACCEPT = "application/pdf,image/jpeg,image/png";
const TONE: Record<CoupleDocument["status"], string> = {
  PENDING: "bg-gray-100 text-gray-800",
  UPLOADED: "bg-amber-100 text-amber-900",
  RECEIVED_IN_PERSON: "bg-emerald-100 text-emerald-900",
  VERIFIED: "bg-emerald-100 text-emerald-900",
  NEEDS_REUPLOAD: "bg-red-100 text-red-900",
};

/** One document: its status, the reason if it needs doing again, and upload or replace. Never a preview. */
export function DocumentCard({ doc, consentWording, maxMb, onChanged }: { doc: CoupleDocument; consentWording: string; maxMb: number; onChanged: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [consented, setConsented] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const needsTick = doc.needsConsent && !consented;
  const id = `pmd-${doc.kind.toLowerCase()}`;

  async function send(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setDone(false);
    if (file.size > maxMb * 1024 * 1024) {
      setProblem(`That file is bigger than ${maxMb} MB. Please upload a smaller copy.`);
      return;
    }
    try {
      if (doc.needsConsent) await recordConsent(doc.kind);
      setProgress(0);
      await uploadDocument(doc.kind, file, setProgress);
      setDone(true);
      onChanged();
    } catch (e) {
      setProblem((e as ApiError).message ?? "The upload did not go through. Please try again.");
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  }

  const busy = progress !== null;
  const replace = doc.status === "UPLOADED";
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={`${id}-title`} className="text-base font-bold sm:text-lg">{doc.label}</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${TONE[doc.status]}`}>{STATUS_WORDS[doc.status]}</span>
      </div>
      {doc.status === "NEEDS_REUPLOAD" && doc.reuploadReason && <p className="mt-2 text-sm text-red-800">{REASON_WORDS[doc.reuploadReason]}</p>}
      {doc.status === "VERIFIED" && <p className="mt-2 text-sm text-gray-600">This document has been accepted. If it needs replacing, please contact the church office.</p>}

      {doc.canUpload && (
        <div className="mt-4 space-y-3">
          {doc.needsConsent && (
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5 h-5 w-5 flex-shrink-0 accent-church-maroon" />
              <span>{consentWording}</span>
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy || needsTick} onClick={() => fileInput.current?.click()} className="min-h-11 rounded-xl bg-church-maroon px-5 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-maroon/40 focus-visible:ring-offset-2 disabled:opacity-50">
              {replace ? "Replace with a file" : "Choose a file"}
            </button>
            <button type="button" disabled={busy || needsTick} onClick={() => cameraInput.current?.click()} className="min-h-11 rounded-xl border-2 border-gray-300 px-5 font-semibold text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-maroon/40 disabled:opacity-50">
              Take a photo
            </button>
          </div>
          <input ref={fileInput} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => send(e.target.files?.[0])} />
          <input ref={cameraInput} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => send(e.target.files?.[0])} />
          {needsTick && <p className="text-sm text-gray-600">Please tick the consent box to upload your medical certificate.</p>}
        </div>
      )}

      <div aria-live="polite" className="mt-3 text-sm">
        {busy && (
          <div>
            <p>Uploading… {progress}%</p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${doc.label}`}>
              <div className="h-full bg-church-maroon transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {done && !busy && <p className="text-emerald-800">Thank you. We have received it, and the pastoral team will review it.</p>}
        {problem && <p role="alert" className="text-red-700">{problem}</p>}
      </div>
    </section>
  );
}
