"use client";

import { useApprovalQueue } from "@/lib/api/approvals";
import ApprovalsQueueList from "./ApprovalsQueueList";

/**
 * Every approval the viewer may decide: unit leads see their own units,
 * department heads see units with no lead, admins see everything (marked
 * when deciding would be an override). Open a person to decide.
 */
export default function ApprovalsQueuePage() {
  const { data, isLoading } = useApprovalQueue();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-0">
      <header>
        <h1 className="text-xl font-bold text-[#111] dark:text-white">Approvals</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          First-timers whose follow-up team says they are ready to be integrated. Open someone to see their profile, visits and notes, then decide.
        </p>
      </header>
      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading" />}
      {!isLoading && !data?.length && (
        <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
          Nothing is waiting on you.
        </p>
      )}
      {!!data?.length && (
        <section className="rounded-2xl border border-gray-200 bg-white px-4 dark:border-white/10 dark:bg-white/[0.04] sm:px-5">
          <ApprovalsQueueList items={data} />
        </section>
      )}
    </div>
  );
}
