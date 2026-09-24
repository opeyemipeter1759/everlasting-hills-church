"use client";

import { Pencil } from "lucide-react";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";

/**
 * Only first-timers are edited here — a member's record is edited from People,
 * which is a different form entirely.
 */
export function RowEditButton({
  row,
  canEdit,
  onEdit,
}: {
  row: MasterListRow;
  canEdit: boolean;
  onEdit: (row: MasterListRow) => void;
}) {
  if (!canEdit || row.kind !== "VISITOR") return null;

  return (
    <button
      type="button"
      onClick={() => onEdit(row)}
      aria-label={`Edit ${row.name}`}
      title="Edit"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#FFE8ED] hover:text-[#87102C] dark:hover:bg-white/10 dark:hover:text-[#FFB3C1]"
    >
      <Pencil size={15} aria-hidden="true" />
    </button>
  );
}
