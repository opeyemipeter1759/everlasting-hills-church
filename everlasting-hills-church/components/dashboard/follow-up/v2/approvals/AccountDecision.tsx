"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useDecideApproval, type ApprovalView } from "@/lib/api/approvals";
import type { PipelineRow } from "@/lib/api/pipeline";
import CreateAccountBtn from "@/components/dashboard/admin/FirstTimer/CreateAccountBtn";
import type { VisitorRow } from "@/components/dashboard/admin/FirstTimer/types";

/** The fields the account button reads, from the pipeline row the queue already has. */
function asVisitor(p: PipelineRow): VisitorRow {
  return {
    id: p.visitorId, firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone,
    gender: null, attendanceType: null, membershipInterest: null, howDidYouLearn: p.heardFrom, locatedInIbadan: null,
    bornAgain: null, occupation: null, submittedAt: p.submittedAt,
  };
}

/**
 * Integrated with no account yet: an admin creates it here (the same step as
 * on the First Timers page), which clears the request, or sets it aside.
 */
export default function AccountDecision({ request, person, onDone }: { request: ApprovalView; person: PipelineRow; onDone?: () => void }) {
  const qc = useQueryClient();
  const decide = useDecideApproval();
  const created = () => {
    qc.invalidateQueries({ queryKey: ["follow-up"] });
    qc.invalidateQueries({ queryKey: ["visitors"] });
    onDone?.();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <CreateAccountBtn visitor={asVisitor(person)} onCreated={created} />
      <button
        type="button"
        onClick={() => decide.mutate({ id: request.id, decision: "CHANGES_REQUESTED" }, { onSuccess: () => onDone?.() })}
        disabled={decide.isPending}
        className="h-9 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/15 dark:text-white/80"
      >
        Not now
      </button>
      {(!person.email || !person.phone) && (
        <p className="w-full text-xs text-gray-500 dark:text-white/45">Add their email and phone on the First Timers page first.</p>
      )}
    </div>
  );
}
