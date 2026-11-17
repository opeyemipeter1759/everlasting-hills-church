"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useDecideApproval } from "@/lib/api/approvals";
import { decideApprovalSchema, firstProblem, type DecideApprovalInput } from "@/lib/follow-up/approval-schema";

interface Props {
  approvalId: string;
  firstName: string;
  /** Deciding as an admin in place of the team leads. */
  asOverride: boolean;
  onDone: () => void;
}

/** Approve, or request changes with a note saying what still needs to happen. */
export default function ApprovalDecisionForm({ approvalId, firstName, asOverride, onDone }: Props) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const decide = useDecideApproval();

  function send(decision: DecideApprovalInput["decision"]) {
    const input = { decision, note: note.trim() || null };
    const problem = firstProblem(decideApprovalSchema, input);
    setError(problem);
    if (problem) return;
    decide.mutate(
      { id: approvalId, ...input },
      {
        onSuccess: () => {
          setNote("");
          onDone();
        },
        onSettled: () => setConfirming(false),
      },
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-white/10">
      {asOverride && (
        <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          You would be deciding as an admin, in place of the team leads. This is flagged and kept on record.
        </p>
      )}
      <label className="block">
        <span className="text-xs font-medium text-gray-600 dark:text-white/55">Note (needed when you ask for changes)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What you saw, or what still needs to happen"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      </label>
      {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={decide.isPending}
          className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => send("CHANGES_REQUESTED")}
          disabled={decide.isPending}
          className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/[0.06]"
        >
          Request changes
        </button>
      </div>
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
