"use client";

import { downloadPeopleExport, useAssignableRoles, usePeople } from "@/lib/api/people";
import PeopleTable from "./PeopleTable";
import BulkActionBar from "./BulkActionBar";
import PeopleHeader from "./people-console/PeopleHeader";
import PeopleStatsStrip from "./people-console/PeopleStatsStrip";
import PeopleRoleChips from "./people-console/PeopleRoleChips";
import PeopleToolbar from "./people-console/PeopleToolbar";
import PeoplePagination from "./people-console/PeoplePagination";
import PeopleDialogs from "./people-console/PeopleDialogs";
import PeopleConfirmDialogs from "./people-console/PeopleConfirmDialogs";
import { useDirectoryParams } from "./people-console/useDirectoryParams";
import { useSelection } from "./people-console/useSelection";
import { usePeopleActions } from "./people-console/usePeopleActions";
import { exportRowsCsv } from "./people-console/csv";
import type { Chip } from "./people-console/constants";

export default function PeopleConsole() {
  const { params, setParams, searchInput, setSearchInput, patch, onSort } = useDirectoryParams();

  const { data, isLoading, isFetching, refetch } = usePeople(params);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const { data: assignableRoles = [] } = useAssignableRoles();

  const { selectedRows, selectedIds, allSelected, toggleRow, toggleAll, clearSelection } = useSelection(rows);
  const actions = usePeopleActions(selectedRows, clearSelection);

  function selectChip(c: Chip) {
    if (c.key === "all") patch({ role: "", hasUnit: "" });
    else if (c.key === "noUnit") patch({ role: "", hasUnit: "false" });
    else patch({ role: c.role, hasUnit: "" });
  }

  const counts = meta?.counts;
  const leaders =
    (counts?.byRole.PASTOR ?? 0) +
    (counts?.byRole.ADMIN ?? 0) +
    (counts?.byRole.UNIT_LEAD ?? 0) +
    (counts?.byRole.SUPER_ADMIN ?? 0) +
    (counts?.byRole.HEAD_USHER ?? 0);

  return (
    <div className="space-y-6 max-w-[1500px]">
      <PeopleHeader
        onAssign={() => actions.openAssign(Object.values(selectedRows))}
        onCreate={() => actions.setCreateOpen(true)}
      />

      <PeopleStatsStrip counts={counts} leaders={leaders} />

      <PeopleRoleChips params={params} counts={counts} onSelect={selectChip} />

      <PeopleToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onFilter={() => actions.setFilterOpen(true)}
        onExport={() => downloadPeopleExport(params)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
      />

      <PeopleTable
        rows={rows}
        loading={isLoading}
        selected={new Set(selectedIds)}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        allSelected={allSelected}
        sortBy={params.sortBy ?? "joinedAt"}
        sortOrder={params.sortOrder ?? "desc"}
        onSort={onSort}
        assignableRoles={assignableRoles}
        onChangeRole={(person, role) => actions.setPendingRole({ person, role })}
        onEdit={actions.setEditTarget}
        onTags={actions.setTagTarget}
        onDelete={actions.setDeleteTarget}
      />

      {meta && (
        <PeoplePagination
          meta={meta}
          onLimitChange={(limit) => patch({ limit }, false)}
          onPrev={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
          onNext={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        />
      )}

      <BulkActionBar
        count={selectedIds.length}
        busy={actions.bulkOp.isPending || actions.deletePerson.isPending}
        onClear={clearSelection}
        onAssign={() => actions.openAssign(Object.values(selectedRows))}
        onSetStatus={actions.bulkStatus}
        onTag={actions.bulkTag}
        onExport={() => exportRowsCsv(Object.values(selectedRows))}
        onDelete={() => actions.setBulkDelete(true)}
      />

      <PeopleDialogs
        createOpen={actions.createOpen}
        onCloseCreate={() => actions.setCreateOpen(false)}
        assignableRoles={assignableRoles}
        assignOpen={actions.assignOpen}
        assignPreselect={actions.assignPreselect}
        onCloseAssign={actions.closeAssign}
        filterOpen={actions.filterOpen}
        onCloseFilter={() => actions.setFilterOpen(false)}
        filterValue={{
          status: params.status,
          gender: params.gender,
          unit: params.unit,
          birthMonth: params.birthMonth,
          joinedFrom: params.joinedFrom,
          joinedTo: params.joinedTo,
        }}
        onApplyFilter={(adv) => patch(adv)}
        editTarget={actions.editTarget}
        onCloseEdit={() => actions.setEditTarget(null)}
        tagTarget={actions.tagTarget}
        onCloseTag={() => actions.setTagTarget(null)}
      />

      <PeopleConfirmDialogs
        pendingRole={actions.pendingRole}
        onConfirmRoleChange={actions.confirmRoleChange}
        onCancelRoleChange={actions.cancelRoleChange}
        roleChangePending={actions.changeRole.isPending}
        deleteTarget={actions.deleteTarget}
        onConfirmDelete={actions.confirmDelete}
        onCancelDelete={actions.cancelDelete}
        deletePending={actions.deletePerson.isPending}
        bulkDelete={actions.bulkDelete}
        bulkCount={selectedIds.length}
        onConfirmBulkDelete={actions.confirmBulkDelete}
        onCancelBulkDelete={actions.cancelBulkDelete}
        actionError={actions.actionError}
      />
    </div>
  );
}
