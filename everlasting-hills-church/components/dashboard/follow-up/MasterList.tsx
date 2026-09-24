"use client";
import { useState } from "react";
import { useFollowUpMasterList, type MasterListQuery, type MasterListRow } from "@/lib/api/follow-up-pipeline";
import { MasterListTable } from "./MasterListTable";
import { MasterListFilters } from "./MasterListFilters";
import { BulkStatusBar } from "./BulkStatusBar";
import { useMasterListEditing } from "./useMasterListEditing";
import { useMasterSelection } from "./useMasterSelection";
import { useFollowUpLeadership } from "./useFollowUpLeadership";
import { PageButton } from "./table-bits";
import { PersonDrawer } from "./PersonDrawer";
import EditVisitorModal from "@/components/dashboard/admin/FirstTimer/EditVisitorModal";

const PAGE_SIZE = 25;

/**
 * Everyone the church is following up. `fixed` pins part of the query — the
 * Assigned to me tab is this same table with the assignee pinned to you, so
 * opening someone there gives the identical details and conversation.
 */
export default function MasterList({ fixed, showFilters = true }: { fixed?: MasterListQuery; showFilters?: boolean }) {
  const [query, setQuery] = useState<MasterListQuery>({});
  const editing = useMasterListEditing();
  const selection = useMasterSelection();
  const { canRunUnit } = useFollowUpLeadership();
  const [selected, setSelected] = useState<MasterListRow | null>(null);
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useFollowUpMasterList({
    ...query,
    ...fixed,
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-3">
      {showFilters && (
        <MasterListFilters
          value={query}
          scope={fixed?.scope}
          statusLocked={!!fixed?.status}
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
      />

      <PersonDrawer person={selected} onClose={() => setSelected(null)} />

      <EditVisitorModal visitor={editing.visitor} onClose={editing.close} onUpdated={editing.saved} />

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-white/45">
            {from}–{to} of {total} {isFetching && <span className="ml-1 opacity-60">updating…</span>}
          </p>
          <div className="flex items-center gap-2">
            <PageButton disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </PageButton>
            <PageButton disabled={to >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </PageButton>
          </div>
        </div>
      )}
    </div>
  );
}
