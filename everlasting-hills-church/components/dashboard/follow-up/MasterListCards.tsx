"use client";

import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { AbsenceBadge } from "./AbsenceBadge";
import { MasterStatusBadge } from "./MasterStatusBadge";
import { RowAvatar } from "./table-bits";
import { RowCheckbox } from "./RowCheckbox";
import { RowEditButton } from "./RowEditButton";
import type { Selection } from "./MasterListTable";

/**
 * The Master list on a phone: one card per person instead of table columns,
 * which cannot fit a name, an assignee, a status and an edit button side by
 * side at that width. Same people, same actions as MasterListRows.
 */
export function MasterListCards({
  rows,
  isLoading,
  canEdit,
  onEdit,
  onOpen,
  selection,
  showAbsence = false,
}: {
  rows: MasterListRow[];
  isLoading: boolean;
  canEdit: boolean;
  onEdit: (row: MasterListRow) => void;
  onOpen: (row: MasterListRow) => void;
  selection: Selection | null;
  showAbsence?: boolean;
}) {
  if (isLoading) {
    return (
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-14 text-center">
        <p className="text-sm font-semibold text-[#111] dark:text-white">Nobody here</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/45">No one matches that name.</p>
      </div>
    );
  }

  const ticked = selection ? rows.filter((row) => selection.has(row)).length : 0;

  return (
    <>
      {selection && (
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
          <RowCheckbox
            label="Select everyone on this page"
            checked={ticked === rows.length}
            indeterminate={ticked > 0 && ticked < rows.length}
            onChange={(select) => selection.toggleAll(rows, select)}
          />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
            {ticked > 0 ? `${ticked} selected` : "Select all"}
          </span>
        </div>
      )}
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {rows.map((row) => (
          <li key={`${row.kind}-${row.id}`} className="flex items-center gap-3 px-4 py-3">
            {selection && (
              <RowCheckbox label={`Select ${row.name}`} checked={selection.has(row)} onChange={() => selection.toggle(row)} />
            )}
            <button
              type="button"
              onClick={() => onOpen(row)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30"
            >
              <RowAvatar name={row.name} photoUrl={row.photoUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#111] dark:text-white">{row.name}</span>
                <span className="block truncate text-xs text-gray-500 dark:text-white/45">
                  {!row.hasAccount && <span className="text-amber-600 dark:text-amber-400">No account yet · </span>}
                  {row.assignedTo ? row.assignedTo.name : "Nobody assigned"}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <MasterStatusBadge status={row.status} />
                  {showAbsence && <AbsenceBadge absence={row.absence} />}
                </span>
              </span>
            </button>
            {!showAbsence && <RowEditButton row={row} canEdit={canEdit} onEdit={onEdit} />}
          </li>
        ))}
      </ul>
    </>
  );
}
