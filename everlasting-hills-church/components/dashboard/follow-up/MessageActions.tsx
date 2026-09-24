"use client";

import { Pencil, Trash2 } from "lucide-react";

/** Edit and delete, floating at the message's top-right on hover — as chat apps do. */
export function MessageActions({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canEdit && !canDelete) return null;
  return (
    <div className="absolute -top-3 right-3 hidden rounded-lg border border-gray-200 bg-white shadow-sm focus-within:flex group-hover:flex dark:border-white/10 dark:bg-[#26262a]">
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit message"
          title="Edit"
          className="rounded-l-lg p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete message"
          title="Delete"
          className="rounded-r-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:text-white/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
