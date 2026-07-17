"use client";

import { useHomeCells } from "./useHomeCells";
import HomeCellHeader from "./HomeCellHeader";
import HomeCellTable from "./HomeCellTable";
import HomeCellModal from "./HomeCellModal";
import HomeCellDialogs from "./HomeCellDialogs";

export default function HomeCellClient() {
  const hook = useHomeCells();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <HomeCellHeader
        filter={hook.filter}
        onFilterChange={hook.setFilter}
        counts={hook.counts}
        onNew={() => hook.setModalOpen(true)}
      />

      <HomeCellTable
        items={hook.items}
        isLoading={hook.isLoading}
        onApprove={hook.setApproveTarget}
        onDelete={hook.setDeleteTarget}
      />

      <HomeCellModal
        open={hook.modalOpen}
        onClose={() => hook.setModalOpen(false)}
        onSubmit={(v) => hook.createMutation.mutate(v)}
        saving={hook.createMutation.isPending}
      />

      <HomeCellDialogs
        approveTarget={hook.approveTarget}
        onCloseApprove={() => hook.setApproveTarget(null)}
        onConfirmApprove={() => hook.approveTarget && hook.approveMutation.mutate(hook.approveTarget.id)}
        approving={hook.approveMutation.isPending}
        deleteTarget={hook.deleteTarget}
        onCloseDelete={() => hook.setDeleteTarget(null)}
        onConfirmDelete={() => hook.deleteTarget && hook.deleteMutation.mutate(hook.deleteTarget.id)}
        deleting={hook.deleteMutation.isPending}
      />
    </div>
  );
}
