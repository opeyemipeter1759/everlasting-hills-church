"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { openDocument, type RequirementRow } from "@/lib/api/marriage-documents";
import { STATUS_WORDS } from "@/lib/api/couple";
import { input, lagosDate, primary, secondary, selectBox, useRun } from "../ui";

export const KIND_LABEL: Record<RequirementRow["kind"], string> = {
  PARENTAL_CONSENT_GROOM: "Intending groom's parental consent letter",
  MEDICAL_CERT_GROOM: "Intending groom's medical certificate",
  PARENTAL_CONSENT_BRIDE: "Intending bride's parental consent letter",
  MEDICAL_CERT_BRIDE: "Intending bride's medical certificate",
};
const REASONS = [
  { value: "UNREADABLE", label: "Unreadable" },
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "WRONG_DOCUMENT", label: "Wrong document" },
  { value: "OUTSIDE_VALIDITY_WINDOW", label: "Test date outside the window" },
  { value: "MISSING_SIGNATURE", label: "Missing signature" },
  { value: "OTHER", label: "Other (they contact the office)" },
];

/**
 * One document on the case page. Accepting means genuine, complete, signed and
 * dated in the window, never a judgement on results.
 */
export function DocumentRow({ r, validFrom }: { r: RequirementRow; validFrom: string }) {
  const { run, pending } = useRun();
  const [mode, setMode] = useState<"" | "verify" | "reupload">("");
  const [testDate, setTestDate] = useState("");
  const [reason, setReason] = useState("");
  const medical = r.kind.startsWith("MEDICAL_");
  const base = `/premarital/documents/${r.id}`;
  const outside = medical && testDate !== "" && testDate < validFrom;

  async function view() {
    try {
      await openDocument(r.id);
    } catch (e) {
      showToast.error((e as ApiError).message || "The file could not be opened.");
    }
  }
  async function verify() {
    if (await run("post", `${base}/verify`, medical ? { testDate } : {}, outside ? "Accepted (the test date is outside the window)" : "Document accepted")) setMode("");
  }

  const facts = [
    r.uploadedAt && `Uploaded ${lagosDate(r.uploadedAt)}`,
    r.verifiedAt && `Accepted ${lagosDate(r.verifiedAt)}${r.verifiedBy ? ` by ${r.verifiedBy}` : ""}`,
    r.testDate && `Test date ${lagosDate(`${r.testDate}T12:00:00Z`)}`,
  ].filter(Boolean);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#111] dark:text-white">{KIND_LABEL[r.kind]}</p>
        <span className="flex items-center gap-2 text-xs font-semibold">
          {r.newUpload && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">New upload</span>}
          <span className="text-gray-700 dark:text-white/70">{STATUS_WORDS[r.status]}</span>
        </span>
      </div>
      {facts.length > 0 && <p className="mt-0.5 text-xs text-gray-600 dark:text-white/55">{facts.join(" · ")}</p>}
      {r.status === "NEEDS_REUPLOAD" && r.reuploadReason && (
        <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">Asked again: {REASONS.find((x) => x.value === r.reuploadReason)?.label}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {r.can.view && <button type="button" className={secondary} onClick={view}>View</button>}
        {r.can.verify && <button type="button" className={secondary} onClick={() => setMode(mode === "verify" ? "" : "verify")}>Accept</button>}
        {r.can.reupload && <button type="button" className={secondary} onClick={() => setMode(mode === "reupload" ? "" : "reupload")}>Ask for it again</button>}
        {r.can.reopen && (
          <button type="button" className={secondary} disabled={pending} onClick={() => run("post", `${base}/reopen`, {}, "Document reopened")}>
            Reopen
          </button>
        )}
      </div>
      {mode === "verify" && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          {medical && (
            <label className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Test date on the certificate
              <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className={`${input} mt-1 w-44`} />
            </label>
          )}
          <button type="button" className={primary} disabled={pending || (medical && !testDate)} onClick={verify}>
            Accept document
          </button>
          {outside && <p role="alert" className="w-full text-xs font-semibold text-amber-800 dark:text-amber-200">This test date is before {lagosDate(`${validFrom}T12:00:00Z`)}, outside the window in the letter.</p>}
        </div>
      )}
      {mode === "reupload" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select value={reason} onChange={setReason} options={REASONS} placeholder="Choose a reason" aria-label="Reason" className={`${selectBox} w-60`} />
          <button
            type="button"
            className={primary}
            disabled={pending || !reason}
            onClick={async () => (await run("post", `${base}/request-reupload`, { reason }, "They have been asked to upload it again")) && setMode("")}
          >
            Send
          </button>
          <span className="text-xs text-gray-600 dark:text-white/55">They get a short email; the reason shows only on their dashboard.</span>
        </div>
      )}
    </li>
  );
}
