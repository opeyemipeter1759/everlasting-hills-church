"use client";

import { useEffect, useState } from "react";
import { usePolicy, type Policy, type PolicyKey } from "@/lib/api/premarital";
import { PageHeader, QueryState, card, input, primary, useRun } from "./ui";

const FIELDS: { key: PolicyKey; label: string; hint: string }[] = [
  { key: "eligibility", label: "Who can apply", hint: "Shown on the public page once approved." },
  { key: "duration", label: "How long counselling runs", hint: "For example the number of sessions." },
  { key: "fees", label: "Cost", hint: "Say if it is free." },
  { key: "counsellors", label: "The counselling team", hint: "The public page shows a team section only once this is approved." },
  { key: "retention", label: "How long applications are kept", hint: "Shown in the privacy notice; archived cases are deleted after this by the documented manual process." },
  { key: "privacyNotice", label: "Privacy notice", hint: "Shown above the form. Blank lines separate paragraphs." },
];

/**
 * Policy values the pastors decide. Every value starts PENDING_PASTORAL_APPROVAL
 * and the public page shows only approved ones (the privacy notice always shows).
 * Pastors edit; the rest of the team can read.
 */
export default function PolicyClient() {
  const q = usePolicy();
  const { run, pending } = useRun();
  const [draft, setDraft] = useState<Policy | null>(null);
  useEffect(() => {
    if (q.data && !draft) setDraft(q.data.policy);
  }, [q.data, draft]);
  const canEdit = !!q.data?.canEdit;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <PageHeader title="Policy" subtitle={canEdit ? "Write each value, then tick Approved when the pastors have agreed it." : "Only the pastors can change these."} />
      <QueryState isLoading={q.isLoading} error={q.error} />
      {draft && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run("put", "/premarital/settings", draft, "Policy saved");
          }}
        >
          {FIELDS.map((f) => (
            <fieldset key={f.key} className={card} disabled={!canEdit}>
              <legend className="sr-only">{f.label}</legend>
              <label htmlFor={`policy-${f.key}`} className="block text-sm font-semibold text-[#111] dark:text-white/90">{f.label}</label>
              <p className="text-xs text-gray-600 dark:text-white/55">{f.hint}</p>
              <textarea
                id={`policy-${f.key}`}
                rows={f.key === "privacyNotice" ? 8 : 2}
                maxLength={4000}
                value={draft[f.key].value}
                onChange={(e) => setDraft({ ...draft, [f.key]: { ...draft[f.key], value: e.target.value } })}
                className={`${input} mt-2 py-2`}
              />
              <label className="mt-2 flex min-h-10 items-center gap-2 text-sm text-[#111] dark:text-white/85">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#87102C]"
                  checked={draft[f.key].state === "APPROVED"}
                  onChange={(e) => setDraft({ ...draft, [f.key]: { ...draft[f.key], state: e.target.checked ? "APPROVED" : "PENDING_PASTORAL_APPROVAL" } })}
                />
                Approved
              </label>
            </fieldset>
          ))}
          {canEdit && (
            <button type="submit" className={primary} disabled={pending}>
              Save policy
            </button>
          )}
        </form>
      )}
    </div>
  );
}
