import { Mail, Pencil, Tag, Trash2 } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import KebabMenu from "@/components/dashboard/admin-overview/KebabMenu";
import { TD } from "./constants";

export default function RowActions({
  p,
  manageable,
  onEdit,
  onTags,
  onResendLogin,
  onDelete,
}: {
  p: PersonRow;
  manageable: boolean;
  onEdit: (p: PersonRow) => void;
  onTags: (p: PersonRow) => void;
  onResendLogin: (p: PersonRow) => void;
  onDelete: (p: PersonRow) => void;
}) {
  return (
    <td className={TD}>
      <div
        className="flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <KebabMenu
          label={`${p.name} options`}
          items={[
            { label: "Edit details", icon: Pencil, onClick: () => onEdit(p) },
            { label: "Edit tags", icon: Tag, onClick: () => onTags(p) },
            ...(p.profileId
              ? [{ label: "Resend login details", icon: Mail, onClick: () => onResendLogin(p) }]
              : []),
            ...(manageable
              ? [{ label: "Delete person", icon: Trash2, danger: true, onClick: () => onDelete(p) }]
              : []),
          ]}
        />
      </div>
    </td>
  );
}
