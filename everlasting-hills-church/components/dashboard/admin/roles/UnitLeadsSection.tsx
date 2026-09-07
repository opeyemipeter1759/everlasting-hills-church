"use client";

import { useMemo, useState } from "react";
import { Search, UserX, Users } from "lucide-react";
import { useUnitsDirectory, type UnitDirectoryUnit } from "@/lib/api";
import { downloadCsv } from "@/lib/export-csv";

/**
 * Read-only roster of who leads which unit.
 *
 * The Roles page could say how many unit leads exist but never who they were,
 * so answering "who leads Ushering" meant opening units one at a time. This
 * lists every unit with its lead, grouped by department, and says plainly where
 * a unit has none — an unled unit is the thing an admin most needs to see, and
 * it is exactly what a count of leads hides.
 *
 * Deliberately without actions. Appointing and standing down leads belongs to
 * the unit and department screens, where the person doing it has the context;
 * this is the overview for Super Admin, Pastor and Admin Head. The endpoint
 * behind it is ADMIN+ only, so no one below them can read it either.
 */
function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

function initials(person: { firstName: string; lastName: string }): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

function LeadCell({ unit }: { unit: UnitDirectoryUnit }) {
  if (!unit.lead) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <UserX size={11} /> No lead assigned
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-[10px] font-black text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]">
        {initials(unit.lead)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {fullName(unit.lead)}
        </p>
        {/* Only rendered when there is one: an empty line reads better than a dash
            that looks like a value. */}
        {unit.lead.email && (
          <p className="truncate text-[11px] text-gray-400 dark:text-white/40">{unit.lead.email}</p>
        )}
      </div>
    </div>
  );
}

export default function UnitLeadsSection() {
  const { data, isLoading, isError, error } = useUnitsDirectory();
  const [search, setSearch] = useState("");

  const units = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data?.units ?? [];
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.department?.name ?? "").toLowerCase().includes(q) ||
        (u.lead ? fullName(u.lead).toLowerCase().includes(q) : false),
    );
  }, [data, search]);

  const unled = units.filter((u) => !u.lead).length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        Could not load unit leads — {(error as { message?: string })?.message ?? "please try again."}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Users size={15} className="text-[#87102C] dark:text-[#e8768a]" />
            Unit leads
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white/45">
            Who leads each unit, across every department. View only — leads are appointed from the
            unit and department screens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a unit or lead"
              aria-label="Find a unit or lead"
              className="w-48 rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                "unit-leads",
                units.map((u) => ({
                  unit: u.name,
                  department: u.department?.name ?? "",
                  lead: u.lead ? fullName(u.lead) : "",
                  leadEmail: u.lead?.email ?? "",
                  leadPhone: u.lead?.phone ?? "",
                  assistant: u.assistant ? fullName(u.assistant) : "",
                  members: u.totalMembers,
                })),
              )
            }
            disabled={units.length === 0}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            CSV
          </button>
        </div>
      </div>

      {unled > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {unled} unit{unled === 1 ? " has" : "s have"} no lead assigned.
        </p>
      )}

      {units.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-white/10 dark:text-white/40">
          {search ? "No unit or lead matches that." : "No units yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 dark:bg-white/[0.03] dark:text-white/35">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Unit</th>
                <th className="px-4 py-3 text-left font-bold">Department</th>
                <th className="px-4 py-3 text-left font-bold">Lead</th>
                <th className="px-4 py-3 text-left font-bold">Assistant</th>
                <th className="px-4 py-3 text-right font-bold">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/[0.06] dark:bg-[#161618]">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{unit.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-white/50">
                    {unit.department?.name ?? (
                      <span className="text-gray-400 dark:text-white/30">Not in a department</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <LeadCell unit={unit} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-white/50">
                    {unit.assistant ? fullName(unit.assistant) : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-white/60">
                    {unit.totalMembers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
