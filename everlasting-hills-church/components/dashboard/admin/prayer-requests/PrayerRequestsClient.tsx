"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePrayerRequests, useDeletePrayerRequest, type PrayerRequestRow } from "@/lib/api/prayer-requests";
import PrayerRequestsSkeleton from "@/components/ui/skeleton/PrayerRequestsSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage } from "./shared";
import { useRequestFilters } from "./useRequestFilters";
import RequestFilters from "./RequestFilters";
import RequestList from "./RequestList";

/** Admin view of every prayer request: filter, mark prayed for, or delete. */
export default function PrayerRequestsClient() {
  const q = usePrayerRequests();
  const deleteRequest = useDeletePrayerRequest();
  const [confirmTarget, setConfirmTarget] = useState<PrayerRequestRow | null>(null);
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
            Administration
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

      <RequestFilters f={f} />
      <RequestList isError={q.isError} total={requests.length} f={f} onDelete={setConfirmTarget} />

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
