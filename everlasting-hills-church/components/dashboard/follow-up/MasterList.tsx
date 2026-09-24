"use client";
import { useEffect, useState } from "react";
import {
  LATEST_SERVICE,
  useFollowUpMasterList,
  type MasterListPage,
  type MasterListQuery,
  type MasterListRow,
} from "@/lib/api/follow-up-pipeline";
import { MasterListTable } from "./MasterListTable";
import { MasterListFilters } from "./MasterListFilters";
import { BulkStatusBar } from "./BulkStatusBar";
import { useMasterListEditing } from "./useMasterListEditing";
import { useMasterSelection } from "./useMasterSelection";
import { useFollowUpLeadership } from "./useFollowUpLeadership";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { PersonDrawer } from "./PersonDrawer";
import EditVisitorModal from "@/components/dashboard/admin/FirstTimer/EditVisitorModal";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Everyone the church is following up. `fixed` pins part of the query — the
 * Assigned to me tab is this same table with the assignee pinned to you, so
 * opening someone there gives the identical details and conversation.
 */
export default function MasterList({
  fixed,
  showFilters = true,
  onMeta,
}: {
  fixed?: MasterListQuery;
  showFilters?: boolean;
  /** Told the totals for the current filters, e.g. for the Integration Team's Absent card. */
  onMeta?: (meta: MasterListPage["meta"] | undefined) => void;
}) {
  // The Integration Team's list opens on who missed the latest service.
  const [query, setQuery] = useState<MasterListQuery>(
    fixed?.scope === "INTEGRATION" && showFilters ? { absentFrom: LATEST_SERVICE } : {},
  );
  const editing = useMasterListEditing();
  const selection = useMasterSelection();
  const { canRunUnit } = useFollowUpLeadership();
  const [selected, setSelected] = useState<MasterListRow | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const { data, isLoading, isFetching } = useFollowUpMasterList({
    ...query,
    ...fixed,
    take: pageSize,
    skip: page * pageSize,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  useEffect(() => {
    onMeta?.(meta);
  }, [meta, onMeta]);
  // The Integration Team watches for people who stop coming, so their list
  // shows each person's absences.
  const showAbsence = fixed?.scope === "INTEGRATION";
  const total = data?.meta.total ?? 0;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      {showFilters && (
        <MasterListFilters
          value={query}
          scope={fixed?.scope}
          statusLocked={!!fixed?.status}
          latestServiceId={meta?.absenceServiceId ?? null}
          onChange={(next) => {
            setQuery(next);
            setPage(0);
          }}
        />
      )}

      {canRunUnit && (
        <BulkStatusBar people={selection.people} onDone={selection.clear} onClear={selection.clear} />
      )}

      <MasterListTable
        rows={rows}
        isLoading={isLoading}
        canEdit={editing.canEdit}
        onEdit={editing.open}
        onOpen={setSelected}
        selection={canRunUnit ? selection : null}
        showAbsence={showAbsence}
      />

      <PersonDrawer person={selected} onClose={() => setSelected(null)} />

      <EditVisitorModal visitor={editing.visitor} onClose={editing.close} onUpdated={editing.saved} />

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="order-2 text-xs text-gray-500 dark:text-white/45 sm:order-1">
            Showing {from}–{to} of {total} {isFetching && <span className="ml-1 opacity-60">updating…</span>}
          </p>
          <div className="order-1 flex flex-wrap items-center gap-3 sm:order-2">
            {/* The shared pagination counts pages from 1; this list from 0. */}
            <Pagination page={page + 1} pageCount={pageCount} onPageChange={(next) => setPage(next - 1)} />
            <Select
              aria-label="Rows per page"
              value={String(pageSize)}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-[#87102C]/25 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
