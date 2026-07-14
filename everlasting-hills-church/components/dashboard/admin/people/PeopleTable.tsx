"use client";

import type { PersonRole, PersonRow } from "@/lib/api/people";
import PeopleTableHead from "./people-table/PeopleTableHead";
import PeopleTableRow from "./people-table/PeopleTableRow";
import EmptyState from "./people-table/EmptyState";

interface Props {
  rows: PersonRow[];
  loading: boolean;
  selected: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (col: string) => void;
  assignableRoles: PersonRole[];
  onChangeRole: (person: PersonRow, role: PersonRole) => void;
  onEdit: (person: PersonRow) => void;
  onTags: (person: PersonRow) => void;
  onDelete: (person: PersonRow) => void;
}

export default function PeopleTable({
  rows,
  loading,
  selected,
  onToggleRow,
  onToggleAll,
  allSelected,
  sortBy,
  sortOrder,
  onSort,
  assignableRoles,
  onChangeRole,
  onEdit,
  onTags,
  onDelete,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
      <div className="overflow-auto max-h-[70vh] no-scrollbar">
        <table className="w-full min-w-[1280px] border-separate border-spacing-0">
          <PeopleTableHead
            allSelected={allSelected}
            hasRows={rows.length > 0}
            onToggleAll={onToggleAll}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
          />
          <tbody>
            {rows.map((p) => (
              <PeopleTableRow
                key={p.id}
                p={p}
                isSel={selected.has(p.id)}
                manageable={p.profileId !== null && assignableRoles.includes(p.role)}
                assignableRoles={assignableRoles}
                onToggleRow={onToggleRow}
                onChangeRole={onChangeRole}
                onEdit={onEdit}
                onTags={onTags}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <EmptyState loading={loading} />}
    </div>
  );
}
