"use client";

import { useState } from "react";
import {
  Circle, Zap, Heart, Clock, Calendar, CheckCircle2,
  BookOpen, Sparkles, Bell, ChevronRight, TrendingUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemberHomeProps {
  member: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
  } | null;
  userEmail: string;
  memberDisplayId: string;
  attendanceRate: number;
  attendanceCount: number;
  streakWeeks: number;
  lastServiceDate: string | null;
  nextService: { name: string; scheduledAt: string } | null;
  hasCheckedInToday: boolean;
  todayService: { id: string; name: string } | null;
  prayerCount: number;
  recentServices: Array<{ name: string; scheduledAt: string; totalAttended: number }>;
  monthlyAttendance: Array<{ label: string; attended: number; total: number }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function standingLabel(rate: number): { text: string; color: string } {
  if (rate >= 90) return { text: "Excellent Standing", color: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 70) return { text: "Good Standing",     color: "text-sky-600 dark:text-sky-400"     };
  if (rate >= 50) return { text: "Fair Standing",     color: "text-amber-600 dark:text-amber-400"  };
  if (rate > 0)   return { text: "Needs Improvement", color: "text-red-600 dark:text-red-400"      };
  return            { text: "No records yet",          color: "text-gray-400"                       };
}

function streakLabel(weeks: number): { text: string; dot: string } {
  if (weeks >= 8) return { text: "Consistent level", dot: "bg-purple-500" };
  if (weeks >= 4) return { text: "Firm level",        dot: "bg-emerald-500" };
  if (weeks >= 2) return { text: "Building level",    dot: "bg-sky-500"    };
  if (weeks === 1) return { text: "Starting level",   dot: "bg-amber-500"  };
  return             { text: "No streak yet",         dot: "bg-gray-400"   };
}

// ── Circular Progress ─────────────────────────────────────────────────────────

function CircleProgress({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5"
        className="stroke-gray-200 dark:stroke-white/10" />
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3.5"
        stroke="#87102C" strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 20 20)" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  title, iconEl, children,
}: { title: string; iconEl: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {title}
        </span>
        <div className="text-gray-400 dark:text-gray-500 mt-0.5">{iconEl}</div>
      </div>
      {children}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  title, iconEl, action, children,
}: { title: string; iconEl: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
            <div className="text-[#87102C]">{iconEl}</div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Check-in Panel ────────────────────────────────────────────────────────────

function CheckInPanel({
  todayService, hasCheckedInToday,
}: { todayService: MemberHomeProps["todayService"]; hasCheckedInToday: boolean }) {
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Check-in failed. Please try again."); return; }
      setCheckedIn(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Sunday Check-In Panel" iconEl={<Calendar size={14} />}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
        Self-service day check-in opens 30 minutes before every Sunday service. To test it,
        click the Services page and open check-in on a service.
      </p>

      {checkedIn ? (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} />
          Checked in for today — God bless you!
        </span>
      ) : todayService ? (
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#87102C] hover:bg-[#6E0C24] border border-[#87102C] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : <Calendar size={13} />}
          Check In Today
        </button>
      ) : (
        <button disabled className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 cursor-not-allowed">
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          Check-In Server Standby
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {/* Quick actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/8">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          Personal Quick Actions
        </p>
        <div className="flex gap-2">
          <a
            href="/prayer-request"
            className="flex-1 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Submit Prayer
          </a>
          <a
            href="/testimony"
            className="flex-1 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Share Testimony
          </a>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Announcements Panel ───────────────────────────────────────────────────────

function AnnouncementsPanel() {
  return (
    <SectionCard
      title="Community Announcements"
      iconEl={<Bell size={14} />}
      action={
        <span className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 cursor-default">
          All Announcements <ChevronRight size={12} />
        </span>
      }
    >
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <Bell size={18} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No announcements yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
          Church announcements will appear here
        </p>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-white/8 mt-2">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Everlasting Hills Communication Desk · Ibadan, NG
        </p>
      </div>
    </SectionCard>
  );
}

// ── Attendance Chart ──────────────────────────────────────────────────────────

function AttendanceChart({ services }: { services: MemberHomeProps["recentServices"] }) {
  const max = Math.max(...services.map((s) => s.totalAttended), 1);

  return (
    <SectionCard title="Recent Service Attendance Peaks" iconEl={<TrendingUp size={14} />}>
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No service data yet</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
            Total members checked in per service
          </p>
          <div className="flex items-end gap-3 h-24 mb-3">
            {services.map((s, i) => {
              const pct = Math.max(8, (s.totalAttended / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {s.totalAttended}
                  </span>
                  <div className="w-full flex items-end gap-0.5" style={{ height: "72px" }}>
                    {/* Background bar */}
                    <div
                      className="flex-1 rounded-t bg-gray-100 dark:bg-white/10"
                      style={{ height: "100%" }}
                    />
                    {/* Attendance bar */}
                    <div
                      className="flex-1 rounded-t bg-[#87102C] opacity-80"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                    {fmtShortDate(s.scheduledAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ services, prayerCount }: {
  services: MemberHomeProps["recentServices"];
  prayerCount: number;
}) {
  const items = [
    ...services.map((s) => ({
      time: relativeTime(s.scheduledAt),
      text: `${s.totalAttended} member${s.totalAttended !== 1 ? "s" : ""} attended ${s.name}`,
      date: s.scheduledAt,
    })),
  ];

  if (prayerCount > 0) {
    items.push({
      time: "On record",
      text: `${prayerCount} prayer request${prayerCount !== 1 ? "s" : ""} submitted to the church`,
      date: new Date().toISOString(),
    });
  }

  return (
    <SectionCard title="Recent Platform Actions" iconEl={<Sparkles size={14} />}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#87102C] mt-1" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                  {item.time}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/8">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Ibadan Diocese Council Oversight Group
        </p>
      </div>
    </SectionCard>
  );
}

// ── Monthly Attendance Chart ──────────────────────────────────────────────────

function MonthlyAttendanceChart({ data }: { data: MemberHomeProps["monthlyAttendance"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 88;

  return (
    <div>
      <div className="flex items-end justify-between gap-2 px-1" style={{ height: CHART_H + 36 }}>
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const attendedH = d.total > 0 ? (d.attended / d.total) * totalH : 0;
          const pct = d.total > 0 ? Math.round((d.attended / d.total) * 100) : null;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 justify-end min-w-0"
              style={{ height: CHART_H + 36 }}
            >
              {pct !== null ? (
                <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {pct}%
                </span>
              ) : (
                <span className="text-[9px] text-gray-300 dark:text-gray-700">—</span>
              )}
              <div
                className="w-full rounded-t relative overflow-hidden bg-gray-200 dark:bg-white/10"
                style={{ height: `${totalH}px` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-700"
                  style={{ height: `${attendedH}px`, backgroundColor: "#87102C", opacity: 0.85 }}
                />
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center truncate w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#87102C] opacity-80" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-gray-200 dark:bg-white/10" />
          Total services
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MemberHome({
  member,
  userEmail,
  memberDisplayId,
  attendanceRate,
  attendanceCount: _count,
  streakWeeks,
  lastServiceDate,
  nextService,
  hasCheckedInToday,
  todayService,
  prayerCount,
  recentServices,
  monthlyAttendance,
}: MemberHomeProps) {
  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : userEmail;

  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const standing = standingLabel(attendanceRate);
  const streak = streakLabel(streakWeeks);

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">👋</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {getGreeting()}, {firstName}!
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              Member ID: {memberDisplayId} · Everlasting Hills Church Family, Ibadan
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System fully operational
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Attendance */}
        <StatCard title="My Attendance" iconEl={<CircleProgress value={attendanceRate} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {attendanceRate}<span className="text-lg font-bold">%</span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Last: {fmtDate(lastServiceDate, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${standing.color}`}>
            {standing.text}
          </p>
        </StatCard>

        {/* Streak */}
        <StatCard title="Attendance Streak" iconEl={<Zap size={18} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {streakWeeks}
            <span className="text-base font-bold ml-1">Wk{streakWeeks !== 1 ? "s" : ""}</span>
          </p>
          {nextService ? (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Next: {new Date(nextService.scheduledAt).toLocaleDateString("en-GB", { weekday: "short" })} {fmtTime(nextService.scheduledAt)}
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">No upcoming service</p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${streak.dot}`} />
            <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{streak.text}</p>
          </div>
        </StatCard>

        {/* Prayer Network */}
        <StatCard title="Prayer Network" iconEl={<Heart size={16} />}>
          <p className="text-sm font-black text-gray-900 dark:text-white leading-snug mt-0.5">
            Active Intercessors
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Your active logs: {prayerCount}
          </p>
          <a
            href="/prayer-request"
            className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] flex items-center gap-0.5 mt-0.5 hover:underline"
          >
            Submit Request <ChevronRight size={11} />
          </a>
        </StatCard>

        {/* Upcoming Service */}
        <StatCard title="Upcoming Service" iconEl={<Clock size={16} />}>
          {nextService ? (
            <>
              <p className="text-sm font-black text-gray-900 dark:text-white leading-snug mt-0.5 line-clamp-2">
                {nextService.name}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {fmtDate(nextService.scheduledAt, { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {fmtTime(nextService.scheduledAt)} · Hills Auditorium
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                No upcoming service
              </p>
              <p className="text-[11px] text-gray-300 dark:text-gray-600">Check back soon</p>
            </>
          )}
        </StatCard>
      </div>

      {/* ── Check-in + Announcements ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CheckInPanel todayService={todayService} hasCheckedInToday={hasCheckedInToday} />
        <AnnouncementsPanel />
      </div>

      {/* ── Chart + Activity Feed ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceChart services={recentServices} />
        <ActivityFeed services={recentServices} prayerCount={prayerCount} />
      </div>

      {/* ── Personal Analytics ──────────────────────────────────────────── */}
      {monthlyAttendance.some((m) => m.total > 0) && (
        <SectionCard
          title="Your Monthly Attendance"
          iconEl={<TrendingUp size={14} />}
        >
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
            Services attended vs. services held — last 6 months
          </p>
          <MonthlyAttendanceChart data={monthlyAttendance} />
        </SectionCard>
      )}

    </div>
  );
}
