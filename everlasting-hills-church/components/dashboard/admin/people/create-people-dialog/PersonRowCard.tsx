import { Trash2 } from "lucide-react";
import type { PersonRole } from "@/lib/api/people";
import { ROLE_LABEL } from "../peopleShared";
import { fieldCls } from "@/components/ui/overlay/FormModal";
import { Select } from "@/components/ui/select";
import type { Row } from "./types";

export default function PersonRowCard({
  index,
  row,
  removable,
  assignableRoles,
  onChange,
  onRemove,
}: {
  index: number;
  row: Row;
  removable: boolean;
  assignableRoles: PersonRole[];
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-[#FFF4F6]/40 dark:bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#87102C] text-white text-[11px]">
            {index + 1}
          </span>
          Person {index + 1}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            aria-label="Remove person"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className={fieldCls}
          placeholder="First name *"
          value={row.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
        />
        <input
          className={fieldCls}
          placeholder="Last name *"
          value={row.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
        />
        <input
          className={fieldCls}
          type="email"
          placeholder="Email *"
          value={row.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
        <input
          className={fieldCls}
          type="tel"
          placeholder="Phone * (initial password)"
          value={row.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
        <Select
          className={fieldCls}
          aria-label="Gender"
          value={row.gender}
          onChange={(v) => onChange({ gender: v as Row["gender"] })}
          options={[
            { value: "", label: "Gender (optional)" },
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
        />
        <Select
          className={fieldCls}
          aria-label="Role"
          value={row.role}
          onChange={(v) => onChange({ role: v as PersonRole })}
          options={assignableRoles.map((role) => ({ value: role, label: ROLE_LABEL[role] }))}
        />
      </div>
    </div>
  );
}
