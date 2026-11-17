"use client";

import { useSubjectApproval } from "@/lib/api/approvals";
import ApprovalSummary from "../approvals/ApprovalSummary";
import ApprovalRequestForm from "../approvals/ApprovalRequestForm";
import ApprovalDecisionForm from "../approvals/ApprovalDecisionForm";
import type { ProfileSectionProps } from "./types";

/**
 * Integration approval: the assignee (or an admin) asks, the unit's current
 * lead decides. Shows the pending request and who decides it, the decision
 * controls to whoever may decide, and the decision and its note afterwards.
 * Who may do what comes from the API; hiding a button here is only UX.
 */
export default function ApprovalSection({ profile, refresh }: ProfileSectionProps) {
  const { visitorId, firstName } = profile.person;
  const { data } = useSubjectApproval(visitorId);
  if (!data) return null;

  const { latest } = data;
  // Nothing on record and nothing this viewer can do: stay out of the way.
  if (!latest && !data.canRequest) return null;
  const pending = latest?.status === "PENDING";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Integration approval">
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">Integration approval</h2>
      {latest && <ApprovalSummary request={latest} deciders={pending ? data.deciders : null} />}
      {pending && data.canDecide && (
        <ApprovalDecisionForm approvalId={latest.id} firstName={firstName} asOverride={data.decideAsOverride} onDone={refresh} />
      )}
      {!pending && data.canRequest && <ApprovalRequestForm visitorId={visitorId} again={!!latest} onDone={refresh} />}
    </section>
  );
}
