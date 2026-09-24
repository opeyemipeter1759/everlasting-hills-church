"use client";

import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { MasterStatusBadge } from "./MasterStatusBadge";
import { RowAvatar } from "./table-bits";
import { RowCheckbox } from "./RowCheckbox";
import { RowEditButton } from "./RowEditButton";
import type { Selection } from "./MasterListTable";
import { TableEmptyRow, TableSkeletonRows } from "./table-states";

interface RowsProps {
  rows: MasterListRow[];
  isLoading: boolean;
  /** Only shown to people whose role may actually save the change. */
  canEdit: boolean;
  onEdit: (row: MasterListRow) => void;
  onOpen: (row: MasterListRow) => void;
  /** Present only for a unit lead or head of department, who may tick rows. */
  selection: Selection | null;
}

/** The body of the Master list table: a row per person, or a stand-in while it loads. */
export function MasterListRows({ rows, isLoading, canEdit, onEdit, onOpen, selection }: RowsProps) {
  const cols = selection ? 5 : 4;
  if (isLoading) return <TableSkeletonRows cols={cols} />;
  if (rows.length === 0) {
    return <TableEmptyRow cols={cols} title="Nobody here" body="No one matches that name." />;
  }

  return (
    <>
      {rows.map((row) => (
        <tr
          key={`${row.kind}-${row.id}`}
          onClick={() => onOpen(row)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(row);
            }
          }}
          className="cursor-pointer transition-colors hover:bg-[#FFF7F9] focus:bg-[#FFF7F9] focus:outline-none dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.03]"
        >
          {selection && (
            <td className="w-10 pl-4" onClick={(e) => e.stopPropagation()}>
              <RowCheckbox
                label={`Select ${row.name}`}
                checked={selection.has(row)}
                onChange={() => selection.toggle(row)}
              />
            </td>
          )}

          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <RowAvatar name={row.name} photoUrl={row.photoUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111] dark:text-white">{row.name}</p>
                <p className="truncate text-xs text-gray-500 dark:text-white/45">
                  {!row.hasAccount && <span className="text-amber-600 dark:text-amber-400">No account yet</span>}
                  {/* The assignee has no column of its own on a phone. */}
                  <span className="sm:hidden">
                    {!row.hasAccount && " · "}
                    {row.assignedTo ? row.assignedTo.name : "Nobody assigned"}
                  </span>
                </p>
              </div>
            </div>
          </td>

          <td className="hidden px-4 py-3 sm:table-cell">
            {row.assignedTo ? (
              <span className="text-sm text-gray-700 dark:text-white/70">{row.assignedTo.name}</span>
            ) : (
              <span className="text-sm text-gray-400 dark:text-white/35">Nobody assigned</span>
            )}
          </td>

          <td className="px-4 py-3">
            <MasterStatusBadge status={row.status} />
          </td>

          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
            <RowEditButton row={row} canEdit={canEdit} onEdit={onEdit} />
          </td>
        </tr>
      ))}
    </>
  );
}
