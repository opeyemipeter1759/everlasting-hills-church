"use client";

import type { ApprovalView, SubjectApproval } from "@/lib/api/approvals";

const PILL: Record<ApprovalView["status"], { label: string; tone: string }> = {
  PENDING: { label: "Waiting for a decision", tone: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-200" },
  APPROVED: { label: "Approved", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300" },
  CANCELLED: { label: "Cancelled", tone: "bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-white/[0.07] dark:text-white/55" },
};

/** "17 Nov 2026", in the church's time zone. */
export function approvalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
}

export function ApprovalPill({ status }: { status: ApprovalView["status"] }) {
  const { label, tone } = PILL[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}>{label}</span>;
}

/** Who decides a pending request, in words. */
export function decidersText(deciders: SubjectApproval["deciders"], unitName: string | null): string {
  const unit = unitName ?? "this unit";
  if (!deciders) return "";
  if (deciders.level === "LEAD") return `${deciders.names.join(" or ")}, lead of ${unit}, decides.`;
  if (deciders.level === "HEAD") return `${unit} has no lead, so ${deciders.names.join(" or ")} (department head) decides.`;
  return `${unit} has no lead or department head, so an admin decides.`;
}

function Quote({ children }: { children: string }) {
  return <p className="mt-2 whitespace-pre-line rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 dark:bg-white/[0.05] dark:text-white/75">{children}</p>;
}

/** The latest request: who asked and when, then who decided and what they said. */
export default function ApprovalSummary({ request, deciders }: { request: ApprovalView; deciders: SubjectApproval["deciders"] }) {
  const asked = `${request.requesterName ?? "Someone"} asked on ${approvalDate(request.createdAt)}.`;
  const decided = request.decidedAt ? approvalDate(request.decidedAt) : "";
  const by = request.deciderName ?? "Someone";

  return (
    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-white/75">
      <ApprovalPill status={request.status} />
      <p>{asked}</p>
      {request.note && <Quote>{request.note}</Quote>}
      {request.status === "PENDING" && <p className="text-gray-600 dark:text-white/60">{decidersText(deciders, request.unitName)}</p>}
      {request.status === "APPROVED" && <p>{by} approved on {decided}. They are now integrated.</p>}
      {request.status === "CHANGES_REQUESTED" && <p>{by} asked for changes on {decided}:</p>}
      {request.status === "CANCELLED" && <p>Cancelled on {decided} because they were reassigned.</p>}
      {request.status !== "CANCELLED" && request.decisionNote && <Quote>{request.decisionNote}</Quote>}
      {request.adminOverride && (
        <p className="text-xs text-gray-500 dark:text-white/45">Decided by an admin in place of the unit lead. This is on record.</p>
      )}
    </div>
  );
}
