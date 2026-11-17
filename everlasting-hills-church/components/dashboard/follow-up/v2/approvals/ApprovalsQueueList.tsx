"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ApprovalQueueItem } from "@/lib/api/approvals";
import { StatusChip } from "../StatusChip";
import { PersonAvatar } from "../PersonCells";
import { approvalDate } from "./ApprovalSummary";

/** Pending approvals, each opening the person's profile so nobody approves blind. */
export default function ApprovalsQueueList({ items }: { items: ApprovalQueueItem[] }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/10">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/dashboard/follow-up/person/${item.subjectId}`}
            className="flex items-start gap-3 px-1 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:px-2"
          >
            <PersonAvatar row={item.person} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#111] dark:text-white">
                  {item.person.firstName} {item.person.lastName}
                </p>
                <StatusChip status={item.person.status} />
                {item.asOverride && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    As admin
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
                {item.person.visits} {item.person.visits === 1 ? "visit" : "visits"}. {item.requesterName ?? "Someone"} asked on {approvalDate(item.createdAt)}
                {item.unitName ? `, under ${item.unitName}` : ""}.
              </p>
              {item.note && <p className="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-white/70">{item.note}</p>}
            </div>
            <ChevronRight size={16} className="mt-1 flex-shrink-0 text-gray-400" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
