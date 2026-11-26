"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useDecideApproval, type ApprovalView } from "@/lib/api/approvals";
import { decideApprovalSchema, firstProblem } from "@/lib/follow-up/approval-schema";
import { APPROVE, BUTTON, QUIET, ROW } from "./decision-styles";

/**
 * Whether a first-timer is integrated, decided on the card the way an
 * assignment is: approve (after a confirm), or ask for changes with a note
 * saying what still needs to happen.
 */
export default function IntegrationDecision({ request, firstName, onDone }: { request: ApprovalView; firstName: string; onDone?: () => void }) {
  const decide = useDecideApproval();
  const [confirming, setConfirming] = useState(false);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(decision: "APPROVED" | "CHANGES_REQUESTED") {
    const input = { decision, note: note.trim() || null };
    const problem = firstProblem(decideApprovalSchema, input);
    setError(problem);
    if (problem) return;
    decide.mutate({ id: request.id, ...input }, { onSuccess: () => onDone?.(), onSettled: () => setConfirming(false) });
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-gray-700 dark:text-white/75">
        {request.requesterName ?? "Their follow-up team"} says {firstName} is ready to be integrated.
      </p>
      <div className={ROW}>
        <button type="button" onClick={() => setConfirming(true)} disabled={decide.isPending} className={APPROVE}>
          Approve: integrate {firstName}
        </button>
        <button type="button" onClick={() => setAsking(!asking)} disabled={decide.isPending} aria-expanded={asking} className={QUIET}>
          Request changes
        </button>
      </div>
      {asking && (
        <div className="space-y-2">
          <textarea
            aria-label="What still needs to happen"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="What still needs to happen"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <button type="button" onClick={() => send("CHANGES_REQUESTED")} disabled={decide.isPending} className={`${BUTTON} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
            Send back to the team
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title={`Approve ${firstName}'s integration?`}
        description="They will show as Integrated everywhere. The Pastor, the admins, their department head and their follow-up team will be told."
        confirmLabel="Approve"
        loading={decide.isPending}
        onConfirm={() => send("APPROVED")}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
