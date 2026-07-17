import { Pencil, Tag, Trash2 } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import { TD } from "./constants";

export default function RowActions({
  p,
  manageable,
  onEdit,
  onTags,
  onDelete,
}: {
  p: PersonRow;
  manageable: boolean;
  onEdit: (p: PersonRow) => void;
  onTags: (p: PersonRow) => void;
  onDelete: (p: PersonRow) => void;
}) {
  return (
    <td className={TD}>
      <div
        className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onEdit(p)}
          title="Edit details"
          className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onTags(p)}
          title="Edit tags"
          className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors"
        >
          <Tag size={14} />
        </button>
        {manageable && (
          <button
            type="button"
            onClick={() => onDelete(p)}
            title="Delete person"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </td>
  );
}
