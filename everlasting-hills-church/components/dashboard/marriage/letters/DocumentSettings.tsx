"use client";

import { useEffect, useState } from "react";
import { useDocumentsConfig, type DocumentsConfig } from "@/lib/api/marriage-documents";
import { PageHeader, QueryState, primary, useRun } from "../ui";
import { SettingField, type FieldSpec } from "./SettingField";

const FIELDS: FieldSpec[] = [
  { key: "screeningTests", label: "Screening tests", hint: "One test per line, in the order the letter lists them.", kind: "lines" },
  { key: "screeningValidityDays", label: "Validity window (days before the application date)", hint: "The letter tells couples results dated earlier are not accepted.", kind: "number" },
  { key: "recommendedLabs", label: "Recommended laboratories", hint: "One per line: name | address | phone. Leave address or phone blank until confirmed.", kind: "labs" },
  { key: "certReturnInstructions", label: "How to return medical certificates", hint: "Printed in the medical letter.", kind: "text" },
  { key: "consentReturnInstructions", label: "How to return the consent letter", hint: "Printed in the consent letter.", kind: "text" },
  { key: "medicalConsentWording", label: "Consent wording before a medical upload", hint: "Shown as a tick box on the upload page.", kind: "text" },
  { key: "documentLinkValidDays", label: "How long the upload link works (days)", hint: "", kind: "number" },
  { key: "documentPageOtp", label: "Ask for an emailed code before the upload page opens", hint: "Protects against forwarded links.", kind: "bool" },
  { key: "maxUploadMb", label: "Largest file accepted (MB)", hint: "Up to 20.", kind: "number" },
  { key: "sendDocumentsToPartner", label: "Also send the partner their own link", hint: "Each then sees only the consent letter and their own certificate.", kind: "bool" },
  { key: "documentsRequiredBefore", label: "All documents accepted before", hint: "Moving a case into this step needs all three documents accepted, unless a Pastor overrides.", kind: "status" },
  { key: "overrideReasons", label: "Reasons a Pastor may give to override", hint: "One per line: CODE | label.", kind: "reasons" },
  { key: "documentRetentionPolicy", label: "Document retention policy", hint: "For information only for now. Nothing is deleted automatically.", kind: "text" },
];

/** The documents settings. Every value starts pending pastoral approval; the system uses what is saved until a Pastor changes it. */
export function DocumentSettings() {
  const q = useDocumentsConfig();
  const { run, pending } = useRun();
  const [draft, setDraft] = useState<DocumentsConfig | null>(null);
  useEffect(() => {
    if (q.data && !draft) setDraft(q.data.config);
  }, [q.data, draft]);
  const canEdit = !!q.data?.canEdit;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Documents settings" subtitle={canEdit ? "Change a value, then tick Approved when the pastors have agreed it." : "Only the pastors can change these."} />
      <QueryState isLoading={q.isLoading} error={q.error} />
      {draft && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run("put", "/premarital/document-settings", draft, "Documents settings saved");
          }}
        >
          {FIELDS.map((f) => (
            <SettingField key={f.key} spec={f} entry={draft[f.key]} disabled={!canEdit} onChange={(entry) => setDraft({ ...draft, [f.key]: entry })} />
          ))}
          {canEdit && (
            <button type="submit" className={primary} disabled={pending}>
              Save documents settings
            </button>
          )}
        </form>
      )}
    </div>
  );
}
