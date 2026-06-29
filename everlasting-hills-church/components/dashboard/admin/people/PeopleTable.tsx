"use client";

import Link from "next/link";
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

const TH =
  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 whitespace-nowrap";

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
    <th className={TH}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
      >
        {label}
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
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
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="bg-[#FFF4F6] dark:bg-white/[0.03] border-b border-[#E7CDD3]/60 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected && rows.length > 0}
                  onChange={onToggleAll}
                  aria-label="Select all on this page"
                  className="h-4 w-4 rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]/30 accent-[#87102C]"
                />
              </th>
              <SortHead label="Person" col="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <SortHead label="Role" col="role" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <th className={TH}>Phone</th>
              <th className={TH}>Gender</th>
              <th className={TH}>Units</th>
              <SortHead label="Status" col="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <th className={TH}>Profile</th>
              <th className={TH}>Birthday</th>
              <SortHead label="Joined" col="joinedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
            {rows.map((p) => {
              const manageable = p.profileId !== null && assignableRoles.includes(p.role);
              const isSel = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`group transition-colors ${
                    isSel
                      ? "bg-[#FFF4F6]/70 dark:bg-[#87102C]/10"
                      : "hover:bg-[#FFF4F6]/40 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => onToggleRow(p.id)}
                      aria-label={`Select ${p.name}`}
                      className="h-4 w-4 rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]/30 accent-[#87102C]"
                    />
                  </td>

                  {/* Person */}
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/members/${p.id}`} className="flex items-center gap-3 group/link">
                      <Avatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/link:text-[#87102C] dark:group-hover/link:text-[#e8768a] transition-colors">
                          {p.name}
                        </p>
                        {p.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40 truncate max-w-[220px]">
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
                  <td className="px-4 py-3">
                    {manageable ? (
                      <select
                        value={p.role}
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
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_BADGE[p.role]}`}
                      >
                        <ShieldCheck size={10} />
                        {ROLE_LABEL[p.role]}
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-white/60 whitespace-nowrap">
                    {p.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="text-gray-300 dark:text-white/30" />
                        {p.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Gender */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-white/60">
                    {genderLabel(p.gender)}
                  </td>

                  {/* Units */}
                  <td className="px-4 py-3">
                    {p.units.length === 0 ? (
                      <span className="text-xs text-gray-300 dark:text-white/25">No unit</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {p.units.map((u) => (
                          <span
                            key={u.id}
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
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        STATUS_BADGE[p.status] ?? STATUS_BADGE.INACTIVE
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  {/* Profile completion */}
                  <td className="px-4 py-3">
                    <ProfileCompletionMeter value={profileCompletion(p)} />
                  </td>

                  {/* Birthday */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-white/60 whitespace-nowrap">
                    {fmtBirthday(p.dateOfBirth)}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-white/50 whitespace-nowrap">
                    {fmtDate(p.joinedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty / loading states */}
      {rows.length === 0 && (
        <div className="py-16 text-center">
          {loading ? (
            <p className="text-sm text-gray-400 dark:text-white/40">Loading people…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No people match these filters
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Adjust the search or filters, or add someone new.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
