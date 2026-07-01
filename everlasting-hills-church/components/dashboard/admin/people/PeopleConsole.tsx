"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  downloadPeopleExport,
  useAssignableRoles,
  useBulkMemberOp,
  useChangeRole,
  useDeletePerson,
  usePeople,
  type DirectoryParams,
  type PersonRole,
  type PersonRow,
} from "@/lib/api/people";
import { ROLE_LABEL } from "./peopleShared";
import PeopleTable from "./PeopleTable";
import CreatePeopleDialog from "./CreatePeopleDialog";
import AssignMembersDialog from "./AssignMembersDialog";
import EditMemberDialog from "./EditMemberDialog";
import TagDialog from "./TagDialog";
import PeopleFilterPanel from "./PeopleFilterPanel";
import BulkActionBar from "./BulkActionBar";

const DEFAULT_PARAMS: DirectoryParams = {
  page: 1,
  limit: 50,
  search: "",
  role: "",
  status: "",
  gender: "",
  unit: "",
  hasUnit: "",
  joinedFrom: "",
  joinedTo: "",
  birthMonth: "",
  sortBy: "joinedAt",
  sortOrder: "desc",
};

type Chip =
  | { key: "all"; label: string }
  | { key: "role"; label: string; role: PersonRole }
  | { key: "noUnit"; label: string };

const ROLE_CHIPS: Chip[] = [
  { key: "all", label: "All" },
  { key: "role", label: "Pastors", role: "PASTOR" },
  { key: "role", label: "Admins", role: "ADMIN" },
  { key: "role", label: "Unit Leads", role: "UNIT_LEAD" },
  { key: "role", label: "Members", role: "MEMBER" },
  { key: "noUnit", label: "No team" },
];

export default function PeopleConsole() {
  const [params, setParams] = useState<DirectoryParams>(DEFAULT_PARAMS);
  const [searchInput, setSearchInput] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, PersonRow>>({});

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPreselect, setAssignPreselect] = useState<PersonRow[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PersonRow | null>(null);
  const [tagTarget, setTagTarget] = useState<PersonRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonRow | null>(null);
  const [pendingRole, setPendingRole] = useState<{ person: PersonRow; role: PersonRole } | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = usePeople(params);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const { data: assignableRoles = [] } = useAssignableRoles();

  const changeRole = useChangeRole();
  const deletePerson = useDeletePerson();
  const bulkOp = useBulkMemberOp();

  // Debounce search → params
  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => ({ ...p, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  function patch(next: Partial<DirectoryParams>, resetPage = true) {
    setParams((p) => ({ ...p, ...next, ...(resetPage ? { page: 1 } : {}) }));
  }

  function onSort(col: string) {
    setParams((p) => ({
      ...p,
      sortBy: col,
      sortOrder: p.sortBy === col && p.sortOrder === "asc" ? "desc" : "asc",
    }));
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  const selectedIds = useMemo(() => Object.keys(selectedRows), [selectedRows]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedRows[r.id]);

  function toggleRow(id: string) {
    const row = rows.find((r) => r.id === id);
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else if (row) next[id] = row;
      return next;
    });
  }
  function toggleAll() {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (allSelected) rows.forEach((r) => delete next[r.id]);
      else rows.forEach((r) => (next[r.id] = r));
      return next;
    });
  }
  const clearSelection = () => setSelectedRows({});

  // ── Active chip resolution ───────────────────────────────────────────────────
  function chipActive(c: Chip): boolean {
    if (c.key === "all") return !params.role && params.hasUnit !== "false";
    if (c.key === "noUnit") return params.hasUnit === "false";
    return params.role === c.role;
  }
  function selectChip(c: Chip) {
    if (c.key === "all") patch({ role: "", hasUnit: "" });
    else if (c.key === "noUnit") patch({ role: "", hasUnit: "false" });
    else patch({ role: c.role, hasUnit: "" });
  }

  // ── Row actions ──────────────────────────────────────────────────────────────
  async function confirmRoleChange() {
    if (!pendingRole?.person.profileId) return;
    setActionError(null);
    try {
      await changeRole.mutateAsync({ profileId: pendingRole.person.profileId, role: pendingRole.role });
      setPendingRole(null);
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Role change failed");
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await deletePerson.mutateAsync({ profileId: deleteTarget.profileId, memberId: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Delete failed");
    }
  }

  // ── Bulk ─────────────────────────────────────────────────────────────────────
  async function bulkStatus(status: string) {
    await bulkOp.mutateAsync({ ids: selectedIds, op: "status", value: status });
    clearSelection();
  }
  async function bulkTag(op: "addTag" | "removeTag", tag: string) {
    await bulkOp.mutateAsync({ ids: selectedIds, op, value: tag });
    clearSelection();
  }
  function bulkExportCsv() {
    exportRowsCsv(Object.values(selectedRows));
  }
  async function confirmBulkDelete() {
    setActionError(null);
    try {
      for (const p of Object.values(selectedRows)) {
        await deletePerson.mutateAsync({ profileId: p.profileId, memberId: p.id });
      }
      setBulkDelete(false);
      clearSelection();
    } catch (err) {
      setActionError((err as { message?: string }).message ?? "Bulk delete failed");
    }
  }

  const c = meta?.counts;
  const leaders =
    (c?.byRole.PASTOR ?? 0) + (c?.byRole.ADMIN ?? 0) + (c?.byRole.UNIT_LEAD ?? 0) + (c?.byRole.SUPER_ADMIN ?? 0);

  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a] mb-1.5">
            Administration
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">People</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            One place to find, manage, assign, and shepherd every member.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setAssignPreselect(Object.values(selectedRows)); setAssignOpen(true); }} className={btnSecondary}>
            <UserCheck size={15} /> Assign
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimaryHdr}>
            <UserPlus size={15} /> New Person
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={<Users size={16} />} label="Total" value={c?.total} />
        <StatCard icon={<Activity size={16} />} label="Active" value={c?.active} />
        <StatCard icon={<ShieldCheck size={16} />} label="Leaders" value={leaders} />
        <StatCard icon={<Network size={16} />} label="On a team" value={c?.withUnit} />
        <StatCard icon={<CalendarPlus size={16} />} label="New this month" value={c?.thisMonth} />
      </div>

      {/* Role chips */}
      <div className="flex flex-wrap gap-2">
        {ROLE_CHIPS.map((chip) => {
          const active = chipActive(chip);
          const count =
            chip.key === "all" ? c?.total : chip.key === "role" ? c?.byRole[chip.role] : undefined;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => selectChip(chip)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                active
                  ? "bg-[#87102C] text-white border-transparent"
                  : "bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 border-[#E7CDD3] dark:border-white/10 hover:border-[#87102C]/40 hover:text-[#87102C] dark:hover:text-[#e8768a]"
              }`}
            >
              {chip.label}
              {count !== undefined && (
                <span className={`text-[10px] ${active ? "text-white/80" : "text-gray-400 dark:text-white/40"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, or phone…"
            className="w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
          />
        </div>
        <button type="button" onClick={() => setFilterOpen(true)} className={btnSecondary}>
          <SlidersHorizontal size={15} /> Filter
        </button>
        <button type="button" onClick={() => downloadPeopleExport(params)} className={btnSecondary}>
          <Download size={15} /> Export CSV
        </button>
        <button
          type="button"
          onClick={() => refetch()}
          className={btnSecondary}
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Table */}
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
        onChangeRole={(person, role) => setPendingRole({ person, role })}
        onEdit={setEditTarget}
        onTags={setTagTarget}
        onDelete={setDeleteTarget}
      />

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-gray-500 dark:text-white/50">
            Showing{" "}
            <span className="font-semibold text-gray-700 dark:text-white">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
            </span>{" "}
            of <span className="font-semibold text-gray-700 dark:text-white">{meta.total}</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              value={meta.limit}
              onChange={(e) => patch({ limit: Number(e.target.value) }, false)}
              className="text-xs rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-700 dark:text-white/70 focus:outline-none"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
              className={pagerBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-gray-600 dark:text-white/60 tabular-nums">
              {meta.page} / {meta.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              className={pagerBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.length}
        busy={bulkOp.isPending || deletePerson.isPending}
        onClear={clearSelection}
        onAssign={() => { setAssignPreselect(Object.values(selectedRows)); setAssignOpen(true); }}
        onSetStatus={bulkStatus}
        onTag={bulkTag}
        onExport={bulkExportCsv}
        onDelete={() => setBulkDelete(true)}
      />

      {/* Dialogs */}
      <CreatePeopleDialog open={createOpen} onClose={() => setCreateOpen(false)} assignableRoles={assignableRoles} />
      <AssignMembersDialog open={assignOpen} onClose={() => { setAssignOpen(false); setAssignPreselect([]); }} preselected={assignPreselect} />
      <PeopleFilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={{
          status: params.status,
          gender: params.gender,
          unit: params.unit,
          birthMonth: params.birthMonth,
          joinedFrom: params.joinedFrom,
          joinedTo: params.joinedTo,
        }}
        onApply={(adv) => patch(adv)}
      />
      <EditMemberDialog person={editTarget} onClose={() => setEditTarget(null)} />
      <TagDialog person={tagTarget} onClose={() => setTagTarget(null)} />

      {/* Confirmations */}
      <ConfirmDialog
        open={pendingRole !== null}
        title={pendingRole ? `Change role to ${ROLE_LABEL[pendingRole.role]}?` : ""}
        description={
          <span>
            <strong className="text-gray-900 dark:text-white">{pendingRole?.person.name}</strong> will move from{" "}
            <strong>{pendingRole ? ROLE_LABEL[pendingRole.person.role] : ""}</strong> to{" "}
            <strong>{pendingRole ? ROLE_LABEL[pendingRole.role] : ""}</strong>. New permissions apply immediately.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel="Yes, change role"
        tone="warning"
        loading={changeRole.isPending}
        onConfirm={confirmRoleChange}
        onCancel={() => { if (!changeRole.isPending) { setPendingRole(null); setActionError(null); } }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this person?"
        description={
          <span>
            <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong> and all their records
            (attendance, notes, follow-ups, assignments) will be permanently removed, including their sign-in
            account. This cannot be undone.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel="Yes, delete permanently"
        tone="danger"
        loading={deletePerson.isPending}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deletePerson.isPending) { setDeleteTarget(null); setActionError(null); } }}
      />

      <ConfirmDialog
        open={bulkDelete}
        title={`Delete ${selectedIds.length} people?`}
        description={
          <span>
            This permanently removes the selected people and all their records and sign-in accounts. This cannot be undone.
            {actionError && <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{actionError}</span>}
          </span>
        }
        confirmLabel={`Delete ${selectedIds.length} permanently`}
        tone="danger"
        loading={deletePerson.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => { if (!deletePerson.isPending) { setBulkDelete(false); setActionError(null); } }}
      />
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a] mb-3">
        {icon}
      </span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
        {value ?? "—"}
      </p>
    </div>
  );
}

function exportRowsCsv(people: PersonRow[]) {
  const headers = ["Name", "Email", "Phone", "Gender", "Role", "Status", "Units", "Tags", "Birthday", "Joined"];
  const body = people.map((p) => [
    p.name,
    p.email ?? "",
    p.phone ?? "",
    p.gender ?? "",
    p.role,
    p.status,
    p.units.map((u) => u.name).join("; "),
    p.tags.join("; "),
    p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    p.joinedAt.slice(0, 10),
  ]);
  const csv = [headers, ...body]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `people-selected-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const btnPrimaryHdr =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors";
const btnSecondary =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-[#FFF4F6] dark:hover:bg-white/10 transition-colors";
const pagerBtn =
  "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/60 hover:bg-[#FFF4F6] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
