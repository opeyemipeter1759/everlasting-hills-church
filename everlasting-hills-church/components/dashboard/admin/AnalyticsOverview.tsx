"use client";

import {
  Users, UserPlus, Heart, TrendingUp, TrendingDown, Minus,
  DollarSign, CheckCircle2, MoreVertical, Calendar, Zap, Clock,
} from "lucide-react";
import type { AdminAnalyticsData } from "@/services/analytics.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG").format(n);
}

function fmtNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${fmt(n)}`;
}

function fmtDelta(delta: number, period: "month" | "year") {
  if (delta === 0) return `No change from last ${period}`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-NG").format(delta)} from last ${period}`;
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 pt-5 pb-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Analytics Widget Card (screenshot-style) ──────────────────────────────────

type WidgetCell = {
  label: string;
  value: string | number;
  sub: string;
  subPositive?: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconFg: string;
};

function AnalyticsWidgetCard({
  title, subtitle, totalIcon: TotalIcon, totalLabel, total, cells,
}: {
  title: string;
  subtitle: string;
  totalIcon: React.ElementType;
  totalLabel: string;
  total: string;
  cells: WidgetCell[];
}) {
  return (
    <Card>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Total row */}
      <div className="px-5 pb-4 flex items-center gap-2 border-b border-gray-100 dark:border-white/8">
        <TotalIcon size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-500 dark:text-gray-400">{totalLabel}</span>
        <span className="ml-auto text-2xl font-black text-gray-900 dark:text-white tabular-nums">
          {total}
        </span>
      </div>

      {/* 2×2 cell grid */}
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {cells.map((cell, i) => {
          const Icon = cell.icon;
          return (
            <div
              key={i}
              className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                  {cell.label}
                </span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 ${cell.iconBg}`}>
                  <Icon size={11} className={cell.iconFg} />
                </div>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                {typeof cell.value === "number" ? fmt(cell.value) : cell.value}
              </p>
              <p className={`text-[11px] mt-1.5 font-medium leading-snug ${
                cell.subPositive
                  ? "text-emerald-500 dark:text-emerald-400"
                  : cell.subPositive === false
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-400 dark:text-gray-500"
              }`}>
                {cell.sub}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TrendChip({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
      <TrendingUp size={11} />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
      <TrendingDown size={11} />{value}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
      <Minus size={11} />0%
    </span>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({
  data, color = "#87102C", height = 100,
}: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-1.5 px-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
          {d.value > 0 && (
            <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">{d.value}</span>
          )}
          <div
            className="w-full rounded-t transition-all duration-700 min-h-[3px]"
            style={{
              height: `${Math.max(3, (d.value / max) * (height - 32))}px`,
              backgroundColor: color,
              opacity: 0.8,
            }}
          />
          <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart (conic-gradient) ──────────────────────────────────────────────

const SOURCE_COLORS = ["#87102C", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280"];

function DonutChart({
  segments,
}: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative flex items-center justify-center w-28 h-28">
          <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="absolute w-16 h-16 rounded-full bg-white dark:bg-[#1c1c1e]" />
          <span className="absolute text-xs text-gray-400">0</span>
        </div>
      </div>
    );
  }
  let cumulative = 0;
  const stops = segments.map((seg, i) => {
    const start = (cumulative / total) * 100;
    cumulative += seg.value;
    const end = (cumulative / total) * 100;
    return `${SOURCE_COLORS[i] ?? "#6b7280"} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });

  return (
    <div className="relative flex items-center justify-center w-28 h-28 flex-shrink-0">
      <div
        className="w-28 h-28 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <div className="absolute w-16 h-16 rounded-full bg-white dark:bg-[#1c1c1e] flex items-center justify-center">
        <span className="text-sm font-black text-gray-900 dark:text-white">{fmt(total)}</span>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{label}</span>
        <span className="font-bold text-gray-900 dark:text-white tabular-nums flex-shrink-0">{fmt(value)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon: Icon, iconBg, trend,
}: {
  title: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string; trend?: number;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon size={18} className="text-white" />
          </div>
          {trend !== undefined && <TrendChip value={trend} />}
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2">{title}</p>
      </div>
    </Card>
  );
}

// ── Attendance Type Visual ────────────────────────────────────────────────────

function AttendanceTypeSplit({ inPerson, online, unspecified }: { inPerson: number; online: number; unspecified: number }) {
  const total = inPerson + online + unspecified || 1;
  const data = [
    { label: "In-Person",    value: inPerson,    color: "#87102C" },
    { label: "Online",       value: online,      color: "#3b82f6" },
    { label: "Not specified",value: unspecified, color: "#d1d5db" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-3 px-5 pb-5">
      {data.map((d) => (
        <ProgressBar key={d.label} label={d.label} value={d.value} total={total} color={d.color} />
      ))}
    </div>
  );
}

// ── Membership Funnel ─────────────────────────────────────────────────────────

function MembershipFunnel({ total, interested, converted }: { total: number; interested: number; converted: number }) {
  const steps = [
    { label: "Total First-Timers",     value: total,      color: "#87102C",  pct: 100 },
    { label: "Expressed Interest",     value: interested, color: "#3b82f6",  pct: total ? Math.round((interested / total) * 100) : 0 },
    { label: "Became Members",         value: converted,  color: "#10b981",  pct: total ? Math.round((converted / total) * 100) : 0 },
  ];

  return (
    <div className="px-5 pb-5 space-y-3">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400 truncate">{step.label}</span>
              <span className="font-bold text-gray-900 dark:text-white tabular-nums ml-2 flex-shrink-0">
                {fmt(step.value)} <span className="text-gray-400 font-normal">({step.pct}%)</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${step.pct}%`, backgroundColor: step.color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsOverview({ data }: { data: AdminAnalyticsData }) {
  const memberMonthDelta   = data.newMembersThisMonth - data.newMembersLastMonth;
  const memberYearDelta    = data.newMembersThisYear  - data.newMembersLastYear;
  const visitorMonthDelta  = data.visitorsThisMonth   - data.visitorsLastMonth;
  const visitorYearDelta   = data.visitorsThisYear    - data.visitorsLastYear;

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Analytics Widget Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnalyticsWidgetCard
          title="Member Analytics"
          subtitle="Registered church members overview"
          totalIcon={Users}
          totalLabel="Total Members"
          total={fmt(data.totalMembers)}
          cells={[
            {
              label: "New This Month",
              value: data.newMembersThisMonth,
              sub: `${data.totalMembers > 0 ? Math.round((data.newMembersThisMonth / data.totalMembers) * 100) : 0}% of total members`,
              icon: UserPlus,
              iconBg: "bg-blue-50 dark:bg-blue-500/15",
              iconFg: "text-blue-500",
            },
            {
              label: "Avg. Attendance",
              value: data.avgAttendance,
              sub: "Per service (last 8)",
              icon: CheckCircle2,
              iconBg: "bg-orange-50 dark:bg-orange-500/15",
              iconFg: "text-orange-500",
            },
            {
              label: "This Month",
              value: data.newMembersThisMonth,
              sub: fmtDelta(memberMonthDelta, "month"),
              subPositive: memberMonthDelta > 0 ? true : memberMonthDelta < 0 ? false : undefined,
              icon: Calendar,
              iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
              iconFg: "text-emerald-500",
            },
            {
              label: "This Year",
              value: data.newMembersThisYear,
              sub: fmtDelta(memberYearDelta, "year"),
              subPositive: memberYearDelta > 0 ? true : memberYearDelta < 0 ? false : undefined,
              icon: TrendingUp,
              iconBg: "bg-purple-50 dark:bg-purple-500/15",
              iconFg: "text-purple-500",
            },
          ]}
        />

        <AnalyticsWidgetCard
          title="First-Timer Analytics"
          subtitle="View detailed visitor insights"
          totalIcon={UserPlus}
          totalLabel="Total First-Timers"
          total={fmt(data.totalVisitors)}
          cells={[
            {
              label: "Today",
              value: data.visitorsToday,
              sub: "First-timers received",
              icon: Zap,
              iconBg: "bg-blue-50 dark:bg-blue-500/15",
              iconFg: "text-blue-500",
            },
            {
              label: "Yesterday",
              value: data.visitorsYesterday,
              sub: "First-timers received",
              icon: Clock,
              iconBg: "bg-sky-50 dark:bg-sky-500/15",
              iconFg: "text-sky-500",
            },
            {
              label: "This Month",
              value: data.visitorsThisMonth,
              sub: fmtDelta(visitorMonthDelta, "month"),
              subPositive: visitorMonthDelta > 0 ? true : visitorMonthDelta < 0 ? false : undefined,
              icon: Calendar,
              iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
              iconFg: "text-emerald-500",
            },
            {
              label: "This Year",
              value: data.visitorsThisYear,
              sub: fmtDelta(visitorYearDelta, "year"),
              subPositive: visitorYearDelta > 0 ? true : visitorYearDelta < 0 ? false : undefined,
              icon: TrendingUp,
              iconBg: "bg-pink-50 dark:bg-pink-500/15",
              iconFg: "text-pink-500",
            },
          ]}
        />
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Members"
          value={fmt(data.totalMembers)}
          sub="Registered church members"
          icon={Users}
          iconBg="bg-[#87102C]"
          trend={data.memberTrend}
        />
        <StatCard
          title="Total First-Timers"
          value={fmt(data.totalVisitors)}
          sub="Visitors who filled the form"
          icon={UserPlus}
          iconBg="bg-blue-500"
        />
        <StatCard
          title="Avg. Attendance"
          value={fmt(data.avgAttendance)}
          sub="Per service (last 8 services)"
          icon={CheckCircle2}
          iconBg="bg-emerald-500"
        />
        <StatCard
          title="Total Giving"
          value={fmtNaira(data.totalGivingNaira)}
          sub="Verified online giving (NGN)"
          icon={DollarSign}
          iconBg="bg-amber-500"
        />
      </div>

      {/* ── Growth + Attendance Trend ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Member Growth" sub="New members per month (last 6 months)" />
          <div className="px-4 pb-5">
            <BarChart data={data.memberGrowth} color="#87102C" height={120} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance Trend" sub="Check-ins per recent service" />
          <div className="px-4 pb-5">
            <BarChart data={data.attendanceTrend} color="#3b82f6" height={120} />
          </div>
        </Card>
      </div>

      {/* ── Visitor Pipeline + Sources ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Visitor Conversion Funnel"
            sub="How first-timers progress to membership"
          />
          <MembershipFunnel
            total={data.totalVisitors}
            interested={data.interested}
            converted={data.totalMembers}
          />
        </Card>

        <Card>
          <CardHeader title="How Visitors Found Us" sub="All-time source breakdown" />
          {data.visitorSources.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-gray-400 dark:text-gray-500">No data yet</div>
          ) : (
            <div className="px-5 pb-5 flex items-start gap-5">
              <DonutChart segments={data.visitorSources} />
              <div className="flex-1 space-y-2.5 min-w-0">
                {data.visitorSources.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[i] ?? "#6b7280" }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{s.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums flex-shrink-0">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Attendance Type + Prayer Volume ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Attendance Type" sub="How visitors join services" />
          <AttendanceTypeSplit
            inPerson={data.inPerson}
            online={data.online}
            unspecified={data.unspecified}
          />
        </Card>

        <Card>
          <CardHeader title="Prayer Request Volume" sub="Submissions per month (last 6 months)" />
          <div className="px-4 pb-5">
            {data.prayersByMonth.every((p) => p.value === 0) ? (
              <div className="flex items-center justify-center h-20 text-sm text-gray-400 dark:text-gray-500">
                <Heart size={18} className="mr-2 opacity-30" />
                No prayer requests in this period
              </div>
            ) : (
              <BarChart data={data.prayersByMonth} color="#8b5cf6" height={120} />
            )}
          </div>
          <div className="px-5 pb-4 border-t border-gray-100 dark:border-white/8 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total all-time: <span className="font-bold text-gray-900 dark:text-white">{fmt(data.totalPrayers)}</span> prayer requests
            </p>
          </div>
        </Card>
      </div>

    </div>
  );
}
