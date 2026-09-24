"use client";

import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { MasterListRows } from "./MasterListRows";
import { RowCheckbox } from "./RowCheckbox";
import { Th } from "./table-bits";
import type { useMasterSelection } from "./useMasterSelection";

export type Selection = ReturnType<typeof useMasterSelection>;

/** The table itself, with a tick column when the viewer may change many at once. */
export function MasterListTable({
  rows,
  isLoading,
  canEdit,
  onEdit,
  onOpen,
  selection,
}: {
  rows: MasterListRow[];
  isLoading: boolean;
  canEdit: boolean;
  onEdit: (row: MasterListRow) => void;
  onOpen: (row: MasterListRow) => void;
  selection: Selection | null;
}) {
  const ticked = selection ? rows.filter((row) => selection.has(row)).length : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <table className="w-full text-left">
        <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            {selection && (
              <th scope="col" className="w-10 pl-4">
                <RowCheckbox
                  label="Select everyone on this page"
                  checked={rows.length > 0 && ticked === rows.length}
                  indeterminate={ticked > 0 && ticked < rows.length}
                  onChange={(select) => selection.toggleAll(rows, select)}
                />
              </th>
            )}
            <Th>Name</Th>
            <Th className="hidden sm:table-cell">Assigned to</Th>
            <Th>Status</Th>
            <Th className="text-right">Edit</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          <MasterListRows
            rows={rows}
            isLoading={isLoading}
            canEdit={canEdit}
            onEdit={onEdit}
            onOpen={onOpen}
            selection={selection}
          />
        </tbody>
      </table>
    </div>
  );
}
