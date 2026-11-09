"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useWelfareRequests, useDeleteWelfareRequest, type WelfareRequestRow } from "@/lib/api/welfare";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorMessage } from "./shared";
import { useWelfareFilters } from "./useWelfareFilters";
import WelfareFilters from "./WelfareFilters";
import WelfareList from "./WelfareList";

/** Admin view of welfare requests: filter by status, move each through review, or delete. */
export default function WelfareClient() {
  const q = useWelfareRequests();
  const deleteRequest = useDeleteWelfareRequest();
  const [confirmTarget, setConfirmTarget] = useState<WelfareRequestRow | null>(null);
  const requests = q.data ?? [];
  const f = useWelfareFilters(requests);

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteRequest.mutateAsync(confirmTarget.id);
      showToast.success("Welfare request deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete welfare request"));
    }
  }

  return (
    <div className="px-5 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welfare Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {f.counts.PENDING} pending{f.counts.IN_REVIEW > 0 ? ` · ${f.counts.IN_REVIEW} in review` : ""}, submissions from the public welfare request form.
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

      <WelfareFilters f={f} />
      <WelfareList isLoading={q.isLoading} isError={q.isError} total={requests.length} f={f} onDelete={setConfirmTarget} />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete welfare request?"
        description={
          <>
            The request from <span className="font-semibold text-gray-900 dark:text-white">{confirmTarget?.fullName}</span> will
            be permanently removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete request"
        tone="danger"
        loading={deleteRequest.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
