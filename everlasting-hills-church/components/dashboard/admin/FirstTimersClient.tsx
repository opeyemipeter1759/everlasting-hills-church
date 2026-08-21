"use client";

import { useState } from "react";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { VisitorRow } from "./FirstTimer/types";
import { useFirstTimersFilter, PAGE_SIZE_OPTIONS } from "./FirstTimer/useFirstTimersFilter";
import PanelHeader from "./FirstTimer/PanelHeader";
import VisitorsTable from "./FirstTimer/VisitorsTable";
import EmptyState from "./FirstTimer/EmptyState";
import EditVisitorModal from "./FirstTimer/EditVisitorModal";
import FirstTimerStatsCards from "./FirstTimer/FirstTimerStatsCards";

export type { VisitorRow };

interface Props {
  visitors: VisitorRow[];
}

export default function FirstTimersClient({ visitors }: Props) {
  const {
    handleCreated,
    handleDeleted,
    handleUpdated,
    active,
    search,
    setSearch,
    filter,
    setFilter,
    filtered,
    pagedRows,
    page,
    pageCount,
    setPage,
    pageSize,
    setPageSize,
    filterTabs,
    total,
  } = useFirstTimersFilter(visitors);

  const [editTarget, setEditTarget] = useState<VisitorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitorRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/visitors/${deleteTarget.id}`);
      showToast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted`);
      handleDeleted(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't delete visitor");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 px-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">First Timers</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
          Review newcomer submissions and create member accounts.
        </p>
      </div>

      <FirstTimerStatsCards active={active} />

      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <PanelHeader
          total={total}
          filterTabs={filterTabs}
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        {filtered.length === 0 ? (
          <EmptyState hasAny={total > 0} />
        ) : (
          <>
            <VisitorsTable
              rows={pagedRows}
              onCreated={handleCreated}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-4 sm:px-6 border-t border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <p className="text-[11px] text-[#8a7e80] dark:text-white/35 order-2 sm:order-1">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-3 order-1 sm:order-2">
                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
                <Select
                  aria-label="Rows per page"
                  value={String(pageSize)}
                  onChange={(v) => setPageSize(Number(v))}
                  className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
                  options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <EditVisitorModal visitor={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />

      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete this visitor?"
        description={
          <>
            <span className="font-semibold">{deleteTarget?.firstName} {deleteTarget?.lastName}</span>'s first-timer record will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
