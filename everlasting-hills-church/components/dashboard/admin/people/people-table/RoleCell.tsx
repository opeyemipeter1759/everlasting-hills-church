import { ShieldCheck } from "lucide-react";
import type { PersonRole, PersonRow } from "@/lib/api/people";
import { ROLE_BADGE, ROLE_LABEL } from "../peopleShared";
import { TD } from "./constants";

export default function RoleCell({
  p,
  manageable,
  assignableRoles,
  onChangeRole,
}: {
  p: PersonRow;
  manageable: boolean;
  assignableRoles: PersonRole[];
  onChangeRole: (person: PersonRow, role: PersonRole) => void;
}) {
  if (!manageable) {
    return (
      <td className={TD}>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_BADGE[p.role]}`}
        >
          <ShieldCheck size={10} />
          {ROLE_LABEL[p.role]}
        </span>
      </td>
    );
  }

  return (
    <td className={TD}>
      <select
        value={p.role}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChangeRole(p, e.target.value as PersonRole)}
        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${ROLE_BADGE[p.role]}`}
      >
        <option value={p.role}>{ROLE_LABEL[p.role]}</option>
        {assignableRoles
          .filter((r) => r !== p.role)
          .map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
      </select>
    </td>
  );
}
