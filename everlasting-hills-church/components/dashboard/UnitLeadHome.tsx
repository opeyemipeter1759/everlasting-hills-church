"use client";

import Link from "next/link";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  Calendar, ChevronRight, Network, BarChart3,
} from "lucide-react";

type UnitMemberRow = {
  memberId: string;
  name: string;
  photoUrl: string | null;
  isLead: boolean;
  status: string;
  attended: number;
  total: number;
  rate: number;
};

type Props = {
  firstName: string | null;
  unitName: string;
  totalMembers: number;
  activeMembers: number;
  attendanceRate: number;
  membersNeedingAttention: number;
  unitMembers: UnitMemberRow[];
  nextService: { name: string; scheduledAt: string } | null;
};

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function UnitLeadHome({
  firstName,
  unitName,
  totalMembers,
  activeMembers,
  attendanceRate,
  membersNeedingAttention,
  unitMembers,
  nextService,
}: Props) {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          You&apos;re leading <span className="font-semibold text-gray-700 dark:text-gray-300">{unitName}</span>. Here&apos;s your unit at a glance.
        </p>
      </div>

      {/* Next service */}
      {nextService && (
        <div className="bg-[#87102C] rounded-xl p-4 text-white flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Next Service</p>
            <p className="font-semibold">{nextService.name}</p>
            <p className="text-sm text-white/80">
              {new Date(nextService.scheduledAt).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}{" "}
              at {new Date(nextService.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: totalMembers, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Active Members", value: activeMembers, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
          { label: "Attendance Rate", value: `${attendanceRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { label: "Need Follow-up", value: membersNeedingAttention, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={16} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Unit members attendance */}
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Unit Members — Attendance (last 3 months)</p>
          <Link
            href="/dashboard/analytics/departments"
            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            Full analytics <ChevronRight size={12} />
          </Link>
        </div>
        {unitMembers.length === 0 ? (
          <p className="text-sm text-gray-400">No members in this unit yet.</p>
        ) : (
          <div className="space-y-3">
            {unitMembers.slice(0, 10).map((m) => (
              <div key={m.memberId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#87102C] to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.name}</p>
                    {m.isLead && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 rounded-full">Lead</span>
                    )}
                    {m.status !== "ACTIVE" && (
                      <span className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 px-1.5 rounded-full">{m.status}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${m.rate >= 70 ? "bg-green-500" : m.rate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${m.rate}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 w-14 text-right">
                      {m.attended}/{m.total} services
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold w-9 text-right flex-shrink-0 ${m.rate >= 70 ? "text-green-500" : m.rate >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                  {m.rate}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/analytics/departments"
          className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-500/40 transition group"
        >
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition">
            <Network size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Department Analytics</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Detailed attendance breakdown</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition" />
        </Link>
        <Link
          href="/dashboard/units"
          className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/8 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-500/40 transition group"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Unit</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Members, assignments, and more</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition" />
        </Link>
      </div>
    </div>
  );
}
