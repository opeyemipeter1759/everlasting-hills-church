"use client";

import { useState } from "react";
import { useLetterTemplates, type LetterKind, type LetterTemplate } from "@/lib/api/marriage-documents";
import { PageHeader, QueryState, card, lagosDate, secondary, useRun } from "../ui";
import { BlockEditor } from "./BlockEditor";

const KINDS: { kind: LetterKind; title: string }[] = [
  { kind: "PARENTAL_CONSENT", title: "Parental consent and blessing" },
  { kind: "MEDICAL_SCREENING", title: "Medical screening requirement" },
];

/**
 * The two letters emailed after an application. Saving makes a new draft
 * version; the version that is sent is the newest one a Pastor approved (or
 * version 1 until any is approved).
 */
export function LettersTab() {
  const q = useLetterTemplates();
  const { run, pending } = useRun();
  const [editing, setEditing] = useState<LetterTemplate | null>(null);
  const data = q.data;

  if (editing) return <BlockEditor template={editing} onDone={() => setEditing(null)} />;
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader
        title="Letters"
        subtitle={data?.canApprove ? "Edit the wording, preview it on the letterhead, then approve the version to send." : "You can edit and preview the wording. A Pastor approves the version that is sent."}
      />
      <QueryState isLoading={q.isLoading} error={q.error} />
      {data &&
        KINDS.map(({ kind, title }) => {
          const versions = data.templates.filter((t) => t.kind === kind);
          return (
            <section key={kind} aria-labelledby={`letter-${kind}`} className={card}>
              <h2 id={`letter-${kind}`} className="text-base font-bold text-[#111] dark:text-white">{title}</h2>
              <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
                {versions.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="text-sm text-[#111] dark:text-white/90">
                      Version {t.version}
                      <span className="ml-2 text-xs text-gray-600 dark:text-white/55">
                        {t.approvalState === "APPROVED" ? `Approved ${lagosDate(t.approvedAt!)}` : "Draft, pending pastoral approval"}
                        {t.active ? " · Sent to couples" : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={secondary} onClick={() => setEditing(t)}>
                        Edit as a new version
                      </button>
                      {data.canApprove && !(t.active && t.approvalState === "APPROVED") && (
                        <button type="button" className={secondary} disabled={pending} onClick={() => run("post", `/premarital/document-templates/${t.id}/approve`, {}, `Version ${t.version} approved and will be sent`)}>
                          Approve and send this
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
