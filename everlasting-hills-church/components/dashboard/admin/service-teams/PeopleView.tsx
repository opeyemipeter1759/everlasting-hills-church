"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Mail, Phone, UserPlus, Users } from "lucide-react";
import { roleLabel, type ServiceTeamPerson } from "@/lib/api/service-teams";

/**
 * One row per person, every team they serve on gathered onto it.
 *
 * On a phone the table becomes a stack of cards rather than a sideways scroll:
 * most of the people using this screen are on a phone, and a roster you have to
 * drag horizontally is one nobody reads.
 */
export default function PeopleView({
  people,
  loading,
  filtered,
  onAdd,
}: {
  people: ServiceTeamPerson[];
  loading?: boolean;
  filtered?: boolean;
  onAdd: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-white/10">
        <Users size={22} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="font-semibold text-gray-700 dark:text-white/80">
          {filtered ? "Nobody matches those filters." : "Nobody is on a team yet."}
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#8a7e80] dark:text-white/45">
          {filtered
            ? "Try a wider department or role."
            : "Put somebody on a team and they will appear here."}
        </p>
        {!filtered && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6E0C24]"
          >
            <UserPlus size={15} /> Add somebody
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
      {/* Header row, desktop only — the mobile layout is cards and needs no header. */}
      <div className="hidden bg-gray-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:gap-4 dark:bg-white/[0.04] dark:text-white/40">
        <span>Person</span>
        <span>Teams</span>
        <span className="text-right">Contact</span>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {people.map((person) => (
          <li
            key={person.memberId}
            className="grid gap-3 bg-white px-4 py-3.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-center sm:gap-4 dark:bg-white/[0.02]"
          >
            {/* Person */}
            <div className="flex min-w-0 items-center gap-3">
              {person.photoUrl ? (
                <Image
                  src={person.photoUrl}
                  alt=""
                  width={34}
                  height={34}
                  className="h-[34px] w-[34px] flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-xs font-bold text-[#87102C] dark:bg-[#FFB3C1]/15 dark:text-[#FFB3C1]"
                >
                  {(person.firstName[0] ?? "").toUpperCase()}
                  {(person.lastName[0] ?? "").toUpperCase()}
                </span>
              )}

              <div className="min-w-0">
                <Link
                  href={`/dashboard/admin/members/${person.memberId}`}
                  className="block truncate text-sm font-bold text-[#111] hover:text-[#87102C] dark:text-white dark:hover:text-[#FFB3C1]"
                >
                  {person.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#8a7e80] dark:text-white/40">
                  {person.leadsCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Crown size={10} /> Leads {person.leadsCount}
                    </span>
                  )}
                  <span>
                    {person.teamCount} team{person.teamCount === 1 ? "" : "s"}
                  </span>
                  {person.status !== "ACTIVE" && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/10 dark:text-white/45">
                      {person.status}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Teams */}
            <div className="flex flex-wrap gap-1.5">
              {person.teams.map((team) => (
                <span
                  key={team.membershipId}
                  title={team.departmentName ?? "No department"}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    team.isLead
                      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                      : team.matchesFilter
                        ? "border-[#87102C]/25 bg-[#FFF4F6] text-[#87102C] dark:border-[#FFB3C1]/25 dark:bg-[#87102C]/15 dark:text-[#FFB3C1]"
                        : // A team that did not match the filter still belongs on
                          // the row — muted, so it reads as context rather than a hit.
                          "border-gray-200 bg-white text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40"
                  }`}
                >
                  {team.isLead && <Crown size={9} />}
                  {team.unitName}
                  <span className="opacity-60">· {roleLabel(team)}</span>
                </span>
              ))}
            </div>

            {/* Contact */}
            <div className="flex items-center gap-1.5 sm:justify-end">
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  aria-label={`Email ${person.name}`}
                  title={person.email}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#87102C] dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-[#FFB3C1]"
                >
                  <Mail size={14} />
                </a>
              )}
              {person.phone && (
                <a
                  href={`tel:${person.phone}`}
                  aria-label={`Call ${person.name}`}
                  title={person.phone}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#87102C] dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-[#FFB3C1]"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
