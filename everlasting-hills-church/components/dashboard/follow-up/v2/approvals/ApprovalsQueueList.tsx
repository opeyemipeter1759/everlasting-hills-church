"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { APPROVAL_KIND_LABEL, type ApprovalQueueItem } from "@/lib/api/approvals";
import { StatusChip } from "../StatusChip";
import { PersonAvatar } from "../PersonCells";
import { approvalDate } from "./ApprovalSummary";
import AssignmentDecision from "./AssignmentDecision";
import AccountDecision from "./AccountDecision";

/** What the request is, in a line. */
function line(item: ApprovalQueueItem): string {
  const when = approvalDate(item.createdAt);
  if (item.kind === "FIRST_TIMER_ASSIGNMENT") return `New first-timer, ${when}${item.unitName ? `, for ${item.unitName}` : ""}.`;
  if (item.kind === "MEMBER_ACCOUNT") return `Integrated ${when}. They need a member account.`;
  const visits = `${item.person.visits} ${item.person.visits === 1 ? "visit" : "visits"}`;
  return `${visits}. ${item.requesterName ?? "Someone"} asked on ${when}${item.unitName ? `, under ${item.unitName}` : ""}.`;
}

/**
 * Everything waiting on the viewer. Assignments and accounts are decided right
 * here; an integration opens the person's profile, so nobody approves blind.
 */
export default function ApprovalsQueueList({ items }: { items: ApprovalQueueItem[] }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/10">
      {items.map((item) => (
        <li key={item.id} className="px-1 py-3.5 sm:px-2">
          <Link href={`/dashboard/follow-up/person/${item.subjectId}`} className="flex items-start gap-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03]">
            <PersonAvatar row={item.person} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#111] dark:text-white">
                  {item.person.firstName} {item.person.lastName}
                </p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-white/10 dark:text-white/75">
                  {APPROVAL_KIND_LABEL[item.kind] ?? item.kind}
                </span>
                <StatusChip status={item.person.status} />
                {item.asOverride && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    As admin
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">{line(item)}</p>
              {item.note && <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-white/70">{item.note}</p>}
            </div>
            <ChevronRight size={16} className="mt-1 flex-shrink-0 text-gray-400" aria-hidden="true" />
          </Link>
          <div className="pl-[52px]">
            {item.kind === "FIRST_TIMER_ASSIGNMENT" && <AssignmentDecision request={item} firstName={item.person.firstName} />}
            {item.kind === "MEMBER_ACCOUNT" && <AccountDecision request={item} person={item.person} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
