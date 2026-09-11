"use client";

import Link from "next/link";
import { AlertTriangle, ChevronDown, Crown, UserPlus } from "lucide-react";
import { useState } from "react";
import { roleLabel, type ServiceTeamMembership, type ServiceTeamPerson, type ServiceTeamSummary } from "@/lib/api/service-teams";

interface Group {
  team: ServiceTeamSummary;
  members: { person: ServiceTeamPerson; membership: ServiceTeamMembership }[];
}

/**
 * The same roster grouped by team.
 *
 * Empty teams are kept and sorted to the bottom rather than hidden. A team with
 * nobody on it is the most actionable row on this screen — sixteen of this
 * church's twenty-one teams are empty — and filtering them out would make the
 * page look healthy by omission.
 */
export default function TeamsView({
  groups,
  loading,
  onAddTo,
}: {
  groups: Group[];
  loading?: boolean;
  onAddTo: (unit: { unitId: string; unitName: string }) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  // Staffed teams first, biggest first; empty ones last, alphabetically.
  const ordered = [...groups].sort((a, b) => {
    if (a.members.length !== b.members.length) return b.members.length - a.members.length;
    return a.team.name.localeCompare(b.team.name);
  });

  // Departments in the order their first team appears, so the grouping is stable.
  const byDepartment = new Map<string, Group[]>();
  for (const group of ordered) {
    const key = group.team.departmentName ?? "No department";
    if (!byDepartment.has(key)) byDepartment.set(key, []);
    byDepartment.get(key)!.push(group);
  }

  return (
    <div className="space-y-6">
      {Array.from(byDepartment.entries()).map(([department, teams]) => (
        <section key={department}>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/35">
            {department}
          </h2>

          <div className="mt-2.5 space-y-2">
            {teams.map(({ team, members }) => {
              const isCollapsed = collapsed[team.id] ?? false;
              const empty = members.length === 0;

              return (
                <div
                  key={team.id}
                  className={`overflow-hidden rounded-2xl border ${
                    empty
                      ? "border-dashed border-amber-300/70 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-500/[0.05]"
                      : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [team.id]: !isCollapsed }))}
                      disabled={empty}
                      aria-expanded={!isCollapsed}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                    >
                      {!empty && (
                        <ChevronDown
                          size={14}
                          className={`flex-shrink-0 text-gray-400 transition-transform dark:text-white/30 ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#111] dark:text-white">
                          {team.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#8a7e80] dark:text-white/40">
                          <span>
                            {members.length} {members.length === 1 ? "person" : "people"}
                          </span>
                          {!team.hasLead && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                              <AlertTriangle size={10} /> No lead
                            </span>
                          )}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddTo({ unitId: team.id, unitName: team.name })}
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#87102C]/30 hover:text-[#87102C] dark:border-white/10 dark:text-white/55 dark:hover:text-[#FFB3C1]"
                    >
                      <UserPlus size={12} /> Add
                    </button>
                  </div>

                  {!empty && !isCollapsed && (
                    <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
                      {members.map(({ person, membership }) => (
                        <li
                          key={membership.membershipId}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <Link
                            href={`/dashboard/admin/members/${person.memberId}`}
                            className="min-w-0 flex-1 truncate text-sm text-gray-700 hover:text-[#87102C] dark:text-white/75 dark:hover:text-[#FFB3C1]"
                          >
                            {person.name}
                          </Link>
                          <span
                            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              membership.isLead
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
                                : "bg-gray-100 text-gray-500 dark:bg-white/[0.07] dark:text-white/45"
                            }`}
                          >
                            {membership.isLead && <Crown size={9} />}
                            {roleLabel(membership)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
