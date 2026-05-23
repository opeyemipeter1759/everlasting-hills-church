"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, Search, UserCheck, UserX, AlertTriangle, Cake,
  ChevronRight, Filter,
} from "lucide-react";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  photoUrl: string | null;
  joinedAt: string;
  dateOfBirth: string | null;
  attendanceCount: number;
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  INACTIVE:    "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400",
  TRANSFERRED: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
  DECEASED:    "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", INACTIVE: "Inactive", TRANSFERRED: "Transferred", DECEASED: "Deceased",
};

function initials(m: Member) {
  return `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
}

function relDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MemberDirectory({
  members,
  birthdayIds,
  absentIds,
}: {
  members: Member[];
  birthdayIds: string[];
  absentIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const birthdaySet = new Set(birthdayIds);
  const absentSet   = new Set(absentIds);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter((m) => {
      const matchQ = !q
        || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
        || m.email?.toLowerCase().includes(q)
        || m.phone?.includes(q);
      const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [members, search, statusFilter]);

  const activeCount   = members.filter((m) => m.status === "ACTIVE").length;
  const inactiveCount = members.filter((m) => m.status === "INACTIVE").length;

  const TABS = [
    { key: "ALL",         label: "All",         count: members.length   },
    { key: "ACTIVE",      label: "Active",       count: activeCount      },
    { key: "INACTIVE",    label: "Inactive",     count: inactiveCount    },
    { key: "TRANSFERRED", label: "Transferred",  count: members.filter((m) => m.status === "TRANSFERRED").length },
  ];

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Members",   value: members.length,       icon: Users,         bg: "bg-sky-50 dark:bg-sky-500/15",         fg: "text-sky-600 dark:text-sky-400" },
          { label: "Active",          value: activeCount,           icon: UserCheck,     bg: "bg-emerald-50 dark:bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-400" },
          { label: "Absent 3+ Suns",  value: absentIds.length,     icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-500/15",     fg: "text-amber-600 dark:text-amber-400" },
          { label: "Birthdays (7d)",  value: birthdayIds.length,   icon: Cake,          bg: "bg-pink-50 dark:bg-pink-500/15",       fg: "text-pink-600 dark:text-pink-400" },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-3 transition-colors">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon size={16} className={fg} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Member Directory</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter tabs */}
            <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-xs font-semibold">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${
                    statusFilter === tab.key
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-white dark:bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold ${statusFilter === tab.key ? "opacity-60" : "text-gray-400"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-52">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Filter size={28} className="text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No members match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/8">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden lg:table-cell">Attendance</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const hasBirthday = birthdaySet.has(m.id);
                  const isAbsent    = absentSet.has(m.id);
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0 text-[#87102C] dark:text-[#e8768a] text-xs font-bold">
                              {initials(m)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                                {m.firstName} {m.lastName}
                              </p>
                              {hasBirthday && <Cake size={11} className="text-pink-500 flex-shrink-0" title="Birthday this week" />}
                              {isAbsent    && <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" title="Absent 3+ Sundays" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">{m.email ?? "—"}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.phone ?? ""}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{relDate(m.joinedAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{m.attendanceCount}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">check-ins</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] ?? ""}`}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <Link
                          href={`/dashboard/members/${m.id}`}
                          className="text-gray-400 dark:text-gray-500 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
                        >
                          <ChevronRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
