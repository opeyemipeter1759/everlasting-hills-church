"use client";

import Link from "next/link";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  Calendar, ChevronRight, Network, BarChart3,
  ArrowUpRight, Clock,
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

function fmtServiceDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function rateColor(rate: number): string {
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function rateTextColor(rate: number): string {
  if (rate >= 70) return "text-emerald-500 dark:text-emerald-400";
  if (rate >= 40) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
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
  const service = nextService ? fmtServiceDate(nextService.scheduledAt) : null;

  const STATS = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: Users,
      iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25",
      iconColor: "text-[#87102C] dark:text-[#FFB3C1]",
    },
    {
      label: "Active Members",
      value: activeMembers,
      icon: CheckCircle,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      iconBg: "bg-sky-50 dark:bg-sky-500/20",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Need Follow-Up",
      value: membersNeedingAttention,
      icon: AlertTriangle,
      iconBg: "bg-amber-50 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO WELCOME CARD
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
      >
        {/* Noise texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div aria-hidden="true" className="absolute -bottom-24 -left-12 w-56 h-56 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-7 sm:p-9 lg:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.32em] uppercase font-bold text-[#FFB3C1] mb-2">
              Unit Dashboard
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
              {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </h2>
            <p className="text-sm text-white/55 mt-2">
              You&apos;re leading{" "}
              <span className="font-bold text-white">{unitName}</span>.
              Here&apos;s your unit at a glance.
            </p>
          </div>

          {/* Unit chip */}
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-sm font-semibold text-white/90">
              <Users size={16} aria-hidden="true" />
              <div className="text-left">
                <p className="text-xs text-white/50 leading-none">Leading</p>
                <p className="font-bold text-white leading-tight mt-0.5">{unitName}</p>
              </div>
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. NEXT SERVICE CARD (conditional)
      ──────────────────────────────────────────────────────────────────────── */}
      {nextService && service && (
        <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none
          hover:border-[#E7CDD3] dark:hover:border-white/[0.18] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] dark:hover:shadow-none transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
              <Calendar size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Next Service
              </p>
              <p className="text-base font-bold text-[#111] dark:text-white leading-tight">{nextService.name}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="inline-flex items-center gap-2 bg-[#FFF4F6] dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-xl px-4 py-2.5">
                <Clock size={14} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-[#111] dark:text-white leading-none">{service.time}</p>
                  <p className="text-[10px] text-[#8a7e80] dark:text-white/40 mt-0.5">{service.date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          3. KPI STAT CARDS
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5
              shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
          >
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-4`}>
              <s.icon size={17} className={s.iconColor} aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-[#111] dark:text-white leading-none">{s.value}</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. UNIT MEMBERS ATTENDANCE
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1]">
                Last 3 Months
              </p>
              <h3 className="text-sm font-bold text-[#111] dark:text-white -mt-0.5">Unit Attendance</h3>
            </div>
          </div>
          <Link
            href="/dashboard/analytics/departments"
            className="group text-xs text-[#87102C] dark:text-[#FFB3C1] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Full analytics
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

        {unitMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-3">
              <Users size={18} className="text-[#87102C] dark:text-[#FFB3C1]" />
            </div>
            <p className="text-sm font-semibold text-[#111] dark:text-white/70">No members in this unit yet.</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1">Members will appear here once assigned.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
            {unitMembers.slice(0, 10).map((m) => (
              <li key={m.memberId} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#87102C] to-[#6E0C24] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-[#111] dark:text-white truncate">{m.name}</p>
                    {m.isLead && (
                      <span className="text-[10px] bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                        Lead
                      </span>
                    )}
                    {m.status !== "ACTIVE" && (
                      <span className="text-[10px] bg-[#FFF4F6] dark:bg-white/[0.06] text-[#8a7e80] dark:text-white/40 border border-[#E7CDD3]/60 dark:border-white/[0.09] px-1.5 py-0.5 rounded-full font-semibold">
                        {m.status}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-[#E7CDD3]/40 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${rateColor(m.rate)}`}
                        style={{ width: `${m.rate}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8a7e80] dark:text-white/35 flex-shrink-0 w-16 text-right">
                      {m.attended}/{m.total} services
                    </span>
                  </div>
                </div>

                {/* Rate badge */}
                <span className={`text-sm font-bold w-10 text-right flex-shrink-0 tabular-nums ${rateTextColor(m.rate)}`}>
                  {m.rate}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. QUICK LINKS
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/analytics/departments"
          className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5 flex items-center gap-4
            hover:border-[#87102C]/30 dark:hover:border-white/[0.18] hover:shadow-[0_4px_24px_rgba(135,16,44,0.07)] dark:hover:shadow-none hover:-translate-y-0.5
            transition-all duration-300 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
            <Network size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111] dark:text-white">Department Analytics</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">Detailed attendance breakdown</p>
          </div>
          <ChevronRight
            size={16}
            className="text-[#b8a8ac] dark:text-white/25 group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] group-hover:translate-x-0.5 transition-all flex-shrink-0"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/dashboard/units"
          className="group bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-5 flex items-center gap-4
            hover:border-[#87102C]/30 dark:hover:border-white/[0.18] hover:shadow-[0_4px_24px_rgba(135,16,44,0.07)] dark:hover:shadow-none hover:-translate-y-0.5
            transition-all duration-300 shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
        >
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={17} className="text-sky-600 dark:text-sky-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111] dark:text-white">Manage Unit</p>
            <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-0.5">Members, assignments, and more</p>
          </div>
          <ChevronRight
            size={16}
            className="text-[#b8a8ac] dark:text-white/25 group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] group-hover:translate-x-0.5 transition-all flex-shrink-0"
            aria-hidden="true"
          />
        </Link>
      </div>

    </div>
  );
}
