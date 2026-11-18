"use client";

import { useState } from "react";
import { useDecideApproval, type ApprovalView } from "@/lib/api/approvals";
import { useFollowUpTeam } from "@/lib/api/follow-up-pipeline";
import { Select } from "@/components/ui/select";

const BUTTON = "h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-60";
const QUIET = `${BUTTON} border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/[0.06]`;

/**
 * Who a new first-timer goes to: approve the person proposed, give them to
 * someone else in the unit, or leave them unassigned to place by hand.
 */
export default function AssignmentDecision({ request, firstName, onDone }: { request: ApprovalView; firstName: string; onDone?: () => void }) {
  const decide = useDecideApproval();
  const { data: team = [] } = useFollowUpTeam(request.unitId);
  const [other, setOther] = useState("");
  const proposed = request.proposedAssignee;
  const send = (decision: "APPROVED" | "CHANGES_REQUESTED", assigneeId?: string) =>
    decide.mutate({ id: request.id, decision, ...(assigneeId ? { assigneeId } : {}) }, { onSuccess: () => onDone?.() });

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-gray-700 dark:text-white/75">
        {proposed?.name ? `${firstName} is proposed to ${proposed.name}.` : `Pick who ${firstName} goes to.`}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {proposed && (
          <button type="button" onClick={() => send("APPROVED")} disabled={decide.isPending} className={`${BUTTON} bg-emerald-600 text-white hover:bg-emerald-700`}>
            Approve: assign to {proposed.name?.split(" ")[0] ?? "them"}
          </button>
        )}
        <Select
          aria-label="Someone else"
          value={other}
          onChange={setOther}
          placeholder="Or pick someone else"
          className={`${QUIET} w-full text-left sm:w-56`}
          options={team.filter((m) => m.id !== proposed?.memberId).map((m) => ({ value: m.id, label: m.name }))}
        />
        {other && (
          <button type="button" onClick={() => send("APPROVED", other)} disabled={decide.isPending} className={`${BUTTON} bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
            Assign to {team.find((m) => m.id === other)?.name.split(" ")[0] ?? "them"} instead
          </button>
        )}
        <button type="button" onClick={() => send("CHANGES_REQUESTED")} disabled={decide.isPending} className={QUIET}>
          Leave unassigned
        </button>
      </div>
    </div>
  );
}
