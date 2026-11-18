"use client";

import { useState } from "react";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { apiClient, type ApiError } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import { useRefreshEverywhere } from "@/lib/api/refresh-everywhere";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { MonthYearFilter } from "@/components/dashboard/follow-up/v2/MonthYearFilter";
import type { VisitorRow } from "./FirstTimer/types";
import { useFirstTimersFilter, PAGE_SIZE_OPTIONS } from "./FirstTimer/useFirstTimersFilter";
import PanelHeader from "./FirstTimer/PanelHeader";
import VisitorsTable from "./FirstTimer/VisitorsTable";
import EmptyState from "./FirstTimer/EmptyState";
import EditVisitorModal from "./FirstTimer/EditVisitorModal";
import FirstTimerStatsCards from "./FirstTimer/FirstTimerStatsCards";
import { ADMIN_MODE, FirstTimersModeProvider, TEAM_MODE } from "./FirstTimer/mode";

export type { VisitorRow };

/**
 * The admin First Timers page. The list, its tabs and the cards are all paged
 * and counted on the server. Deleting a first-timer is for good; the audit
 * trail keeps a copy of their details. With
 * `team`, the First Timer Team's view of it: no prayer requests, and editing
 * only (accounts, imports and deleting stay with the admins).
 */
export default function FirstTimersClient({ team = false }: { team?: boolean }) {
  return (
    <FirstTimersModeProvider value={team ? TEAM_MODE : ADMIN_MODE}>
      <FirstTimersPage team={team} />
    </FirstTimersModeProvider>
  );
}

function FirstTimersPage({ team }: { team: boolean }) {
  const f = useFirstTimersFilter();
  const refreshEverywhere = useRefreshEverywhere();
  const [editTarget, setEditTarget] = useState<VisitorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitorRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/visitors/${deleteTarget.id}`);
      showToast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted`);
      refreshEverywhere(); // this page, Follow Up and every count held them
      setDeleteTarget(null);
    } catch (err) {
      showToast.error((err as ApiError).message ?? "Couldn't delete them");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{team ? "First Timer Team" : "First Timers"}</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            {team ? "Every first-timer's details, to follow up and correct. Prayer requests stay with the pastors." : "Review newcomer submissions and create member accounts."}
          </p>
        </div>
        <MonthYearFilter />
      </div>

      <FirstTimerStatsCards data={f.data} loading={f.isLoading} />

      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
        <PanelHeader
          total={f.total}
          filterTabs={f.filterTabs}
          filter={f.filter}
          onFilterChange={f.setFilter}
          search={f.search}
          onSearchChange={f.setSearch}
          fromDate={f.fromDate}
          toDate={f.toDate}
          onFromDateChange={f.setFromDate}
          onToDateChange={f.setToDate}
          onClearDates={f.clearDates}
        />

        {f.isLoading && !f.data ? (
          <div className="h-48 animate-pulse bg-gray-50 dark:bg-white/[0.02]" aria-label="Loading first timers" />
        ) : f.shown === 0 ? (
          <EmptyState hasAny={f.total > 0 || !!f.search || f.filter !== "all"} />
        ) : (
          <>
            <VisitorsTable rows={f.pagedRows} onCreated={f.handleCreated} onEdit={setEditTarget} onDelete={setDeleteTarget} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-4 sm:px-6 border-t border-[#E7CDD3]/40 dark:border-white/[0.07]">
              <p className="text-[11px] text-[#8a7e80] dark:text-white/35 order-2 sm:order-1">
                Showing {(f.page - 1) * f.pageSize + 1} to {Math.min(f.page * f.pageSize, f.shown)} of {f.shown}
              </p>
              <div className="flex items-center gap-3 order-1 sm:order-2">
                <Pagination page={f.page} pageCount={f.pageCount} onPageChange={f.setPage} />
                <Select
                  aria-label="Rows per page"
                  value={String(f.pageSize)}
                  onChange={(v) => f.setPageSize(Number(v))}
                  className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
                  options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <EditVisitorModal visitor={editTarget} onClose={() => setEditTarget(null)} onUpdated={f.handleUpdated} />

      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete this first timer for good?"
        description={
          <>
            <span className="font-semibold">{deleteTarget?.firstName} {deleteTarget?.lastName}</span>, their follow-up record, the team&apos;s notes
            about them, their visits and the messages sent to them are deleted and cannot be brought back. A copy of their details is kept in
            the audit trail with your name.
          </>
        }
        confirmLabel="Delete for good"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
