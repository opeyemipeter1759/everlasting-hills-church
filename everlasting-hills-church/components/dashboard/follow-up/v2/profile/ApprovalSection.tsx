"use client";

import { useSubjectApproval } from "@/lib/api/approvals";
import ApprovalSummary from "../approvals/ApprovalSummary";
import ApprovalRequestForm from "../approvals/ApprovalRequestForm";
import ApprovalDecisionForm from "../approvals/ApprovalDecisionForm";
import AssignmentDecision from "../approvals/AssignmentDecision";
import AccountDecision from "../approvals/AccountDecision";
import type { ProfileSectionProps } from "./types";

const CARD = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]";
const TITLE = "text-sm font-semibold text-[#111] dark:text-white";

/**
 * Approvals about this person: who they go to (waiting for the team leads),
 * their integration (the assignee or an admin asks, the team leads decide),
 * and, once integrated, the account an admin is asked to create. Who may do
 * what comes from the API; hiding a button here is only UX.
 */
export default function ApprovalSection({ profile, refresh }: ProfileSectionProps) {
  const { visitorId, firstName } = profile.person;
  const { data } = useSubjectApproval(visitorId);
  if (!data) return null;

  const { latest, assignment, account } = data;
  const pending = latest?.status === "PENDING";
  const showIntegration = !!latest || data.canRequest;
  if (!showIntegration && !assignment && !account) return null;

  return (
    <>
      {assignment && (
        <section className={CARD} aria-label="Assignment waiting for approval">
          <h2 className={TITLE}>Waiting for the team leads</h2>
          {assignment.canDecide ? (
            <AssignmentDecision request={assignment} firstName={firstName} onDone={refresh} />
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
              Proposed to {assignment.proposedAssignee?.name ?? "someone in the unit"}. A team lead approves who they go to.
            </p>
          )}
        </section>
      )}
      {showIntegration && (
        <section className={CARD} aria-label="Integration approval">
          <h2 className={TITLE}>Integration approval</h2>
          {latest && <ApprovalSummary request={latest} deciders={pending ? data.deciders : null} />}
          {pending && data.canDecide && (
            <ApprovalDecisionForm approvalId={latest.id} firstName={firstName} asOverride={data.decideAsOverride} onDone={refresh} />
          )}
          {!pending && data.canRequest && <ApprovalRequestForm visitorId={visitorId} again={!!latest} onDone={refresh} />}
        </section>
      )}
      {account && (
        <section className={CARD} aria-label="Account to create">
          <h2 className={TITLE}>Account to create</h2>
          {account.canDecide ? (
            <AccountDecision request={account} person={profile.person} onDone={refresh} />
          ) : (
            <p className="mt-2 text-sm text-gray-600 dark:text-white/60">Integrated. The admins have been asked to create their member account.</p>
          )}
        </section>
      )}
    </>
  );
}
