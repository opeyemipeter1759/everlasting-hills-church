"use client";

import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import type { PersonRole, PersonRow } from "@/lib/api/people";
import {
  displayId,
  fmtBirthday,
  fmtDate,
  genderLabel,
  profileCompletion,
  ProfileCompletionMeter,
  STATUS_BADGE,
} from "../peopleShared";
import { COL, TD, stickyBg } from "./constants";
import PersonCell from "./PersonCell";
import RowActions from "./RowActions";

export default function PeopleTableRow({
  p,
  isSel,
  manageable,
  assignableRoles,
  onToggleRow,
  onChangeRole,
  onEdit,
  onTags,
  onDelete,
}: {
  p: PersonRow;
  isSel: boolean;
  manageable: boolean;
  assignableRoles: PersonRole[];
  onToggleRow: (id: string) => void;
  onChangeRole: (person: PersonRow, role: PersonRole) => void;
  onEdit: (person: PersonRow) => void;
  onTags: (person: PersonRow) => void;
  onDelete: (person: PersonRow) => void;
}) {
  const router = useRouter();
  const sBg = stickyBg(isSel);

  return (
    <tr
      onClick={() => router.push(`/dashboard/admin/members/${p.id}`)}
      className={`group cursor-pointer transition-colors ${isSel ? "bg-[#FFF4F6]/60 dark:bg-[#87102C]/10" : "hover:bg-[#fdeef1] dark:hover:bg-[#170e12]"}`}
    >
      <td
        className={`${TD} ${sBg} static lg:sticky lg:z-20`}
        style={{ left: COL.check.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSel}
          onChange={() => onToggleRow(p.id)}
          aria-label={`Select ${p.name}`}
          className="h-4 w-4 rounded border-gray-300 accent-[#87102C]"
        />
      </td>
      <td className={`${TD} ${sBg} static lg:sticky lg:z-20`} style={{ left: COL.id.left }}>
        <span className="font-mono text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] whitespace-nowrap">
          {displayId(p.id)}
        </span>
      </td>
      <PersonCell p={p} sBg={sBg} />
      <td className={`${TD} text-sm text-gray-600 dark:text-white/60 whitespace-nowrap`}>
        {p.phone ? (
          <span className="inline-flex items-center gap-1">
            <Phone size={12} className="text-gray-300 dark:text-white/30" />
            {p.phone}
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className={`${TD} text-sm text-gray-600 dark:text-white/60`}>{genderLabel(p.gender)}</td>

      <td className={TD}>
        {p.units.length === 0 ? (
          <span className="text-xs text-gray-300 dark:text-white/25">No team</span>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {p.units.map((u) => (
              <span
                key={u.id}
                title={u.isLead ? "Team lead" : u.isAssistant ? "Assistant" : "Worker"}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF4F6] text-[#9b3050] border border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10"
              >
                {u.name}
                {u.isLead ? " ★" : u.isAssistant ? " ◦" : ""}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className={TD}>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_BADGE[p.status] ?? STATUS_BADGE.INACTIVE}`}>
          {p.status}
        </span>
      </td>

      <td className={TD}>
        <ProfileCompletionMeter value={profileCompletion(p)} />
      </td>

      <td className={`${TD} text-sm text-gray-600 dark:text-white/60 whitespace-nowrap`}>{fmtBirthday(p.dateOfBirth)}</td>

      <td className={`${TD} text-sm text-gray-500 dark:text-white/50 whitespace-nowrap`}>{fmtDate(p.joinedAt)}</td>

      <RowActions p={p} manageable={manageable} onEdit={onEdit} onTags={onTags} onDelete={onDelete} />
    </tr>
  );
}
