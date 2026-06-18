"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  HeartHandshake,
  LayoutDashboard,
  RefreshCw,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getFrontendSessionUser } from "@/lib/auth/frontend-session";
import { useAdminDashboardData } from "./useAdminDashboardData";
import type { StatKey } from "@/lib/mock/admin-dashboard.mock";
import DashboardStatCard from "./DashboardStatCard";
import GivingSummaryCard from "./GivingSummaryCard";
import AIInsightsCard from "./AIInsightsCard";
import AttendanceTrendCard from "./AttendanceTrendCard";
import FirstTimerFunnelCard from "./FirstTimerFunnelCard";
import UpcomingEventsCard from "./UpcomingEventsCard";
import PastoralCareCard from "./PastoralCareCard";
import BirthdayAnniversaryCard from "./BirthdayAnniversaryCard";
import MinistryUnitsOverview from "./MinistryUnitsOverview";
import RecentActivitiesCard from "./RecentActivitiesCard";
import QuickActionsCard from "./QuickActionsCard";

const STAT_META: Record<StatKey, { icon: LucideIcon; iconBg: string; iconColor: string; href: string }> = {
  members: { icon: Users, iconBg: "bg-[#FFE8ED] dark:bg-[#87102C]/25", iconColor: "text-[#87102C] dark:text-[#FFB3C1]", href: "/dashboard/members" },
  attendance: { icon: CalendarCheck, iconBg: "bg-emerald-50 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", href: "/dashboard/attendance" },
  visitors: { icon: UserPlus, iconBg: "bg-amber-50 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", href: "/dashboard/first-timers" },
  volunteers: { icon: HeartHandshake, iconBg: "bg-violet-50 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400", href: "/dashboard/units" },
  events: { icon: CalendarDays, iconBg: "bg-sky-50 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400", href: "/dashboard/events" },
  sermons: { icon: BookOpen, iconBg: "bg-rose-50 dark:bg-rose-500/15", iconColor: "text-rose-600 dark:text-rose-400", href: "/dashboard/sermons" },
};

export default function AdminDashboardClient() {
  const { status, data, error, refetch } = useAdminDashboardData();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const dismiss = (id: string) => setHidden((prev) => new Set(prev).add(id));
  const visible = (id: string) => !hidden.has(id);

  const members = data?.stats.find((s) => s.key === "members")?.value;
  const attendance = data?.stats.find((s) => s.key === "attendance")?.value;

  return (
    <div className="space-y-6">
      <WelcomeHero members={members} attendance={attendance} />

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "empty" && <EmptyState />}

      {status === "success" && data && (
        <div className="space-y-6">
          {/* Summary stats — each card links to its page */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {data.stats.map((s) => {
              const meta = STAT_META[s.key];
              return (
                <DashboardStatCard
                  key={s.key}
                  label={s.label}
                  value={s.value}
                  trend={s.trend}
                  icon={meta.icon}
                  iconBg={meta.iconBg}
                  iconColor={meta.iconColor}
                  href={meta.href}
                />
              );
            })}
          </div>

          {/* Executive insight */}
          <div className="grid gap-6 lg:grid-cols-2">
            {visible("giving") && (
              <GivingSummaryCard
                giving={data.giving}
                viewMoreHref="/dashboard/giving"
                onDismiss={() => dismiss("giving")}
              />
            )}
            {visible("ai") && (
              <AIInsightsCard
                insights={data.aiInsights}
                viewMoreHref="/dashboard/follow-ups"
                onDismiss={() => dismiss("ai")}
              />
            )}
          </div>

          {/* Attendance trend — full width */}
          {visible("attendance") && (
            <AttendanceTrendCard
              data={data.attendanceTrend}
              viewMoreHref="/dashboard/analytics/attendance"
              onDismiss={() => dismiss("attendance")}
            />
          )}

          {/* Funnel + events */}
          <div className="grid gap-6 lg:grid-cols-2">
            {visible("funnel") && (
              <FirstTimerFunnelCard
                stages={data.firstTimerFunnel}
                viewMoreHref="/dashboard/first-timers"
                onDismiss={() => dismiss("funnel")}
              />
            )}
            {visible("events") && (
              <UpcomingEventsCard
                events={data.upcomingEvents}
                viewMoreHref="/dashboard/events"
                onDismiss={() => dismiss("events")}
              />
            )}
          </div>

          {/* Pastoral care + birthdays */}
          <div className="grid gap-6 lg:grid-cols-2">
            {visible("pastoral") && (
              <PastoralCareCard
                care={data.pastoralCare}
                viewMoreHref="/dashboard/prayer-requests"
                onDismiss={() => dismiss("pastoral")}
              />
            )}
            {visible("birthdays") && (
              <BirthdayAnniversaryCard
                celebrations={data.celebrations}
                viewMoreHref="/dashboard/members"
                onDismiss={() => dismiss("birthdays")}
              />
            )}
          </div>

          {/* Ministry units — full width */}
          {visible("units") && (
            <MinistryUnitsOverview
              units={data.ministryUnits}
              viewMoreHref="/dashboard/units"
              onDismiss={() => dismiss("units")}
            />
          )}

          {/* Activities + quick actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            {visible("activities") && (
              <RecentActivitiesCard
                activities={data.recentActivities}
                viewMoreHref="/dashboard/audit-log"
                onDismiss={() => dismiss("activities")}
              />
            )}
            <QuickActionsCard />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Welcome hero (carries the signed-in admin's name) ───────────────────── */

function WelcomeHero({ members, attendance }: { members?: number; attendance?: number }) {
  // Computed after mount to avoid SSR/client hydration mismatch (cookie + clock are
  // only available client-side).
  const [hero, setHero] = useState<{ greeting: string; name: string | null; date: string }>({
    greeting: "Welcome",
    name: null,
    date: "",
  });

  useEffect(() => {
    const h = new Date().getHours();
    const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const name = getFrontendSessionUser()?.fullName?.trim().split(/\s+/)[0] ?? null;
    const date = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setHero({ greeting, name, date });
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #2a0410 0%, #4a0819 35%, #87102C 75%, #a01535 100%)" }}
    >
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none text-[80px] font-black leading-none tracking-tight text-white/[0.04]">
        EHC
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-6 p-7 sm:flex-row sm:items-center sm:p-9">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-[#FFB3C1]">
            Super Admin{hero.date ? ` · ${hero.date}` : ""}
          </p>
          <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl">
            {hero.greeting}
            {hero.name ? `, ${hero.name}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 max-w-[46ch] text-sm text-white/55">
            Here&apos;s everything happening across Everlasting Hills Church today.
          </p>
        </div>

        {(members !== undefined || attendance !== undefined) && (
          <div className="flex flex-wrap gap-2.5">
            {members !== undefined && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <Users size={14} aria-hidden="true" />
                {members.toLocaleString()} members
              </span>
            )}
            {attendance !== undefined && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <CheckCircle size={14} aria-hidden="true" />
                {attendance.toLocaleString()} last service
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── States ──────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard…</span>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.04]" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-8 py-16 text-center dark:border-red-500/20 dark:bg-red-500/10">
      <AlertTriangle size={28} className="mb-3 text-red-500 dark:text-red-400" aria-hidden="true" />
      <p className="text-base font-semibold text-red-800 dark:text-red-300">Couldn&apos;t load the dashboard</p>
      <p className="mt-1 max-w-md text-sm text-red-600/80 dark:text-red-400/70">
        {message ?? "Something went wrong while fetching the data."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6E0C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
      >
        <RefreshCw size={15} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7CDD3]/60 bg-white px-8 py-16 text-center dark:border-white/[0.09] dark:bg-white/[0.05]">
      <LayoutDashboard size={28} className="mb-3 text-[#87102C]/40 dark:text-[#FFB3C1]/40" aria-hidden="true" />
      <p className="text-base font-semibold text-[#111] dark:text-white">No dashboard data yet</p>
      <p className="mt-1 max-w-md text-sm text-[#8a7e80] dark:text-white/45">
        Metrics will appear here as members, attendance and activity are recorded.
      </p>
    </div>
  );
}
