"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePrayerRequests, useDeletePrayerRequest, useFirstTimerPrayerPoints, type PrayerRequestRow } from "@/lib/api/prayer-requests";
import PrayerRequestsSkeleton from "@/components/ui/skeleton/PrayerRequestsSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage } from "./shared";
import { useRequestFilters } from "./useRequestFilters";
import RequestFilters from "./RequestFilters";
import RequestList from "./RequestList";
import FirstTimerPrayerPoints from "./FirstTimerPrayerPoints";

type Tab = "requests" | "first-timers";

/**
 * Every prayer request, for the pastors and admins: the prayer request form's,
 * to filter, mark prayed for or delete, and the ones first-timers wrote on
 * their form, which the follow-up team never sees.
 */
export default function PrayerRequestsClient() {
  const q = usePrayerRequests();
  const deleteRequest = useDeletePrayerRequest();
  const [confirmTarget, setConfirmTarget] = useState<PrayerRequestRow | null>(null);
  const [tab, setTab] = useState<Tab>("requests");
  const firstTimers = useFirstTimerPrayerPoints();
  const requests = q.data ?? [];
  const f = useRequestFilters(requests);

  if (q.isLoading) return <PrayerRequestsSkeleton />;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const prayedCount = requests.filter((r) => r.status === "PRAYED").length;

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteRequest.mutateAsync(confirmTarget.id);
      showToast.success("Prayer request deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete prayer request"));
    }
  }

  return (
    <div className="px-5 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Pastoral
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Prayer Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {pendingCount} pending{prayedCount > 0 ? ` · ${prayedCount} prayed for` : ""} — signed-in submitters are always identified here, even when marked anonymous.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Prayer requests" className="flex gap-1 border-b border-gray-200 dark:border-white/10">
        {([
          ["requests", `Prayer request form (${requests.length})`],
          ["first-timers", `From first-timers (${firstTimers.data?.length ?? 0})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px min-h-11 border-b-2 px-3 text-sm font-semibold ${tab === id ? "border-[#87102C] text-[#87102C] dark:text-[#e8768a]" : "border-transparent text-gray-500 dark:text-white/50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <>
          <RequestFilters f={f} />
          <RequestList isError={q.isError} total={requests.length} f={f} onDelete={setConfirmTarget} />
        </>
      ) : (
        <FirstTimerPrayerPoints q={firstTimers} />
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete prayer request?"
        description="This cannot be undone."
        confirmLabel="Delete request"
        tone="danger"
        loading={deleteRequest.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
