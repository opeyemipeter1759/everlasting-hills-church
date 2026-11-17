"use client";

import Link from "next/link";
import { useApprovalQueue } from "@/lib/api/approvals";
import ApprovalsQueueList from "./ApprovalsQueueList";

/**
 * The unit-lead dashboard's approvals queue: first-timers waiting on this
 * unit's lead to approve their integration. Shows nothing when none are
 * waiting, so a lead of any other team never sees an empty box.
 */
export default function ApprovalsQueueCard({ unitId }: { unitId: string }) {
  const { data } = useApprovalQueue(unitId);
  if (!data?.length) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-white dark:border-amber-500/25 dark:bg-[#1c1c1e]" aria-label="Approvals waiting on you">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/10">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Approvals waiting on you ({data.length})
        </h2>
        <Link href="/dashboard/follow-up/approvals" className="text-xs font-semibold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]">
          See all
        </Link>
      </div>
      <div className="px-4 sm:px-5">
        <ApprovalsQueueList items={data} />
      </div>
    </section>
  );
}
