import { Mail, Pencil, Tag, Trash2, UserCheck, UserX } from "lucide-react";
import type { PersonRow } from "@/lib/api/people";
import KebabMenu from "@/components/dashboard/admin-overview/KebabMenu";
import { TD } from "./constants";

export default function RowActions({
  p,
  manageable,
  onEdit,
  onTags,
  onChangeStatus,
  onResendLogin,
  onDelete,
}: {
  p: PersonRow;
  manageable: boolean;
  onEdit: (p: PersonRow) => void;
  onTags: (p: PersonRow) => void;
  onChangeStatus: (p: PersonRow) => void;
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
            {
              label: p.status === "ACTIVE" ? "Mark non-active / left" : "Reactivate member",
              icon: p.status === "ACTIVE" ? UserX : UserCheck,
              danger: p.status === "ACTIVE",
              onClick: () => onChangeStatus(p),
            },
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
