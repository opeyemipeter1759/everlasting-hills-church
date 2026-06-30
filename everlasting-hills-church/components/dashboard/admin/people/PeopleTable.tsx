"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";
import type { PersonRole, PersonRow } from "@/lib/api/people";
import {
  Avatar,
  displayId,
  fmtBirthday,
  fmtDate,
  genderLabel,
  profileCompletion,
  ProfileCompletionMeter,
  ROLE_BADGE,
  ROLE_LABEL,
  STATUS_BADGE,
} from "./peopleShared";

interface Props {
  rows: PersonRow[];
  loading: boolean;
  selected: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (col: string) => void;
  assignableRoles: PersonRole[];
  onChangeRole: (person: PersonRow, role: PersonRole) => void;
  onEdit: (person: PersonRow) => void;
  onTags: (person: PersonRow) => void;
  onDelete: (person: PersonRow) => void;
}

// Sticky-left column geometry (must stay in sync across header + body).
const COL = {
  check: { left: 0, width: 48 },
  id: { left: 48, width: 104 },
  name: { left: 152, width: 240 },
};

const TH =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 whitespace-nowrap bg-[#FFF4F6] dark:bg-[#1a1014] border-b border-[#E7CDD3]/60 dark:border-white/10";
const TD = "px-4 py-3 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]";
// Solid background so scrolling content passes *under* the frozen columns.
function stickyBg(isSel: boolean) {
  return isSel
    ? "bg-[#FFF4F6] dark:bg-[#1d1116]"
    : "bg-white dark:bg-[#140b10] group-hover:bg-[#fdeef1] dark:group-hover:bg-[#170e12]";
}

function SortHead({
  label,
  col,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  col: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (c: string) => void;
}) {
  const active = sortBy === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
    >
      {label}
      {active ? (
        sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ChevronsUpDown size={12} className="opacity-40" />
      )}
    </button>
  );
}

export default function PeopleTable({
  rows,
  loading,
  selected,
  onToggleRow,
  onToggleAll,
  allSelected,
  sortBy,
  sortOrder,
  onSort,
  assignableRoles,
  onChangeRole,
  onEdit,
  onTags,
  onDelete,
}: Props) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full min-w-[1280px] border-separate border-spacing-0">
          <thead>
            <tr>
              {/* Frozen: checkbox */}
              <th
                className={`${TH} sticky top-0 z-40`}
                style={{ left: COL.check.left, width: COL.check.width, minWidth: COL.check.width }}
              >
                <input
                  type="checkbox"
                  checked={allSelected && rows.length > 0}
                  onChange={onToggleAll}
                  aria-label="Select all on this page"
                  className="h-4 w-4 rounded border-gray-300 accent-[#87102C]"
                />
              </th>
              {/* Frozen: ID */}
              <th
                className={`${TH} sticky top-0 z-40`}
                style={{ left: COL.id.left, width: COL.id.width, minWidth: COL.id.width }}
              >
                ID
              </th>
              {/* Frozen: Person (name) */}
              <th
                className={`${TH} sticky top-0 z-40 shadow-[1px_0_0_0_rgba(231,205,211,0.6)]`}
                style={{ left: COL.name.left, width: COL.name.width, minWidth: COL.name.width }}
              >
                <SortHead label="Person" col="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </th>
              {/* Scrolling columns */}
              <th className={`${TH} sticky top-0 z-30`}>
                <SortHead label="Role" col="role" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </th>
              <th className={`${TH} sticky top-0 z-30`}>Phone</th>
              <th className={`${TH} sticky top-0 z-30`}>Gender</th>
              <th className={`${TH} sticky top-0 z-30`}>EHC Service Team</th>
              <th className={`${TH} sticky top-0 z-30`}>
                <SortHead label="Status" col="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </th>
              <th className={`${TH} sticky top-0 z-30`}>Profile</th>
              <th className={`${TH} sticky top-0 z-30`}>Birthday</th>
              <th className={`${TH} sticky top-0 z-30`}>
                <SortHead label="Joined" col="joinedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </th>
              <th className={`${TH} sticky top-0 z-30 text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((p) => {
              const manageable = p.profileId !== null && assignableRoles.includes(p.role);
              const isSel = selected.has(p.id);
              const sBg = stickyBg(isSel);
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/dashboard/members/${p.id}`)}
                  className={`group cursor-pointer transition-colors ${isSel ? "bg-[#FFF4F6]/60 dark:bg-[#87102C]/10" : "hover:bg-[#fdeef1] dark:hover:bg-[#170e12]"}`}
                >
                  {/* Frozen: checkbox */}
                  <td
                    className={`${TD} ${sBg} sticky z-20`}
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

                  {/* Frozen: ID */}
                  <td className={`${TD} ${sBg} sticky z-20`} style={{ left: COL.id.left }}>
                    <span className="font-mono text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] whitespace-nowrap">
                      {displayId(p.id)}
                    </span>
                  </td>

                  {/* Frozen: Person */}
                  <td
                    className={`${TD} ${sBg} sticky z-20 shadow-[1px_0_0_0_rgba(231,205,211,0.5)]`}
                    style={{ left: COL.name.left }}
                  >
                    <Link
                      href={`/dashboard/members/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 group/link"
                    >
                      <Avatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/link:text-[#87102C] dark:group-hover/link:text-[#e8768a] transition-colors">
                          {p.name}
                        </p>
                        {p.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40 truncate max-w-[200px]">
                            <Mail size={11} className="flex-shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </span>
                        )}
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* Role */}
                  <td className={TD}>
                    {manageable ? (
                      <select
                        value={p.role}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onChangeRole(p, e.target.value as PersonRole)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${ROLE_BADGE[p.role]}`}
                      >
                        <option value={p.role}>{ROLE_LABEL[p.role]}</option>
                        {assignableRoles.filter((r) => r !== p.role).map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_BADGE[p.role]}`}>
                        <ShieldCheck size={10} />
                        {ROLE_LABEL[p.role]}
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className={`${TD} text-sm text-gray-600 dark:text-white/60 whitespace-nowrap`}>
                    {p.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="text-gray-300 dark:text-white/30" />
                        {p.phone}
                      </span>
                    ) : "—"}
                  </td>

                  {/* Gender */}
                  <td className={`${TD} text-sm text-gray-600 dark:text-white/60`}>{genderLabel(p.gender)}</td>

                  {/* EHC Service Team */}
                  <td className={TD}>
                    {p.units.length === 0 ? (
                      <span className="text-xs text-gray-300 dark:text-white/25">No team</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.units.map((u) => (
                          <span
                            key={u.id}
                            title={u.isLead ? "Team lead" : u.isAssistant ? "Assistant" : "Member"}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF4F6] text-[#9b3050] border border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10"
                          >
                            {u.name}
                            {u.isLead ? " ★" : u.isAssistant ? " ◦" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className={TD}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_BADGE[p.status] ?? STATUS_BADGE.INACTIVE}`}>
                      {p.status}
                    </span>
                  </td>

                  {/* Profile */}
                  <td className={TD}>
                    <ProfileCompletionMeter value={profileCompletion(p)} />
                  </td>

                  {/* Birthday */}
                  <td className={`${TD} text-sm text-gray-600 dark:text-white/60 whitespace-nowrap`}>{fmtBirthday(p.dateOfBirth)}</td>

                  {/* Joined */}
                  <td className={`${TD} text-sm text-gray-500 dark:text-white/50 whitespace-nowrap`}>{fmtDate(p.joinedAt)}</td>

                  {/* Actions */}
                  <td className={TD}>
                    <div
                      className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button type="button" onClick={() => onEdit(p)} title="Edit details" className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => onTags(p)} title="Edit tags" className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors">
                        <Tag size={14} />
                      </button>
                      {manageable && (
                        <button type="button" onClick={() => onDelete(p)} title="Delete person" className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="py-16 text-center">
          {loading ? (
            <p className="text-sm text-gray-400 dark:text-white/40">Loading people…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No people match these filters</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Adjust the search or filters, or add someone new.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
