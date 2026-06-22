"use client";
import Link from "next/link";
import {
  Zap, Heart, Clock,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/cards/StatCard";
import { CircleProgress } from "@/components/ui/feedback/CircleProgress";
import { CheckInPanel } from "./CheckInPanel";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { AttendanceChart } from "./AttendanceChart";
import { ActivityFeed } from "./ActivityFeed";
import { ProfileEditCard } from "./ProfileEditCard";
import { useMemberQrBanner } from "@/hooks";
import { fmtDate, fmtTime, getGreeting, streakLabel } from "@/utils/ServiceUtils";
import { useMe, useMemberOverview } from "@/lib/api";
import { MemberHomeSkeleton } from "@/components/ui/skeleton/MemberHomeSkeleton";
import { dummyMemberHome } from "./DummyData";

export type { MemberHomeProps } from "@/types";

function memberDisplayId(id: string | null | undefined): string {
  if (!id) return "EHC-NEW";
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

function birthdayCountdown(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dob = new Date(dateOfBirth);
  const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
  return diff >= 0 && diff <= 7 ? diff : null;
}

export default function MemberHome() {
  const { data: meData, isLoading: meLoading } = useMe();
  const { data: overviewData, isLoading: overviewLoading } = useMemberOverview();
  const { qrBanner, setQrBanner } = useMemberQrBanner();

  if (meLoading || overviewLoading) return <MemberHomeSkeleton />;
  const apiMember = meData?.member;
  const member = apiMember
    ? {
        firstName: apiMember.firstName ?? "",
        lastName: apiMember.lastName ?? "",
        email: apiMember.email,
        phone: apiMember.phone,
        address: apiMember.address,
        dateOfBirth: apiMember.dateOfBirth,
        bio: apiMember.bio,
        photoUrl: apiMember.photoUrl,
      }
    : dummyMemberHome.member;

  const userEmail = apiMember?.email ?? dummyMemberHome.userEmail;
  const displayId = memberDisplayId(apiMember?.id);
  const birthdayDaysUntil = birthdayCountdown(apiMember?.dateOfBirth);

  // ── Dummy data (replaced by real endpoints as they're built) ────────────
  const {
    streakWeeks,
    nextService,
    hasCheckedInToday,
    todayService,
    prayerCount,
    recentServices,
  } = dummyMemberHome;

  // ── Derived display values ───────────────────────────────────────────────
  const displayName = member ? `${member.firstName} ${member.lastName}` : userEmail;
  const firstName = member?.firstName || displayName.split(" ")[0];
  const streak = streakLabel(streakWeeks);
  const initials = member?.firstName && member?.lastName
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── QR Check-in Result ───────────────────────────────────────────── */}
      {qrBanner && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium transition-colors ${
          qrBanner.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            : qrBanner.type === "already"
            ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400"
            : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
        }`}>
          <span className="text-lg flex-shrink-0">
            {qrBanner.type === "success" ? "✅" : qrBanner.type === "already" ? "ℹ️" : "❌"}
          </span>
          <span className="flex-1">
            {qrBanner.type === "success"
              ? `Checked in to ${qrBanner.service ?? "service"} successfully!`
              : qrBanner.type === "already"
              ? `You already checked in to ${qrBanner.service ?? "this service"}.`
              : "QR check-in failed. Please try again or contact the admin."}
          </span>
          <button type="button" onClick={() => setQrBanner(null)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

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
              Member ID: {displayId} · Everlasting Hills Church Family, Ibadan
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System fully operational
        </div>
      </div>

      {/* ── Birthday Banner ─────────────────────────────────────────────── */}
      {birthdayDaysUntil !== null && (
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border border-pink-200 dark:border-pink-500/20 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors">
          <span className="text-3xl flex-shrink-0">{birthdayDaysUntil === 0 ? "🎂" : "🎉"}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
              {birthdayDaysUntil === 0
                ? `Happy Birthday, ${firstName}! 🎊`
                : `Your birthday is ${birthdayDaysUntil === 1 ? "tomorrow" : `in ${birthdayDaysUntil} days`}!`}
            </p>
            <p className="text-xs text-pink-500 dark:text-pink-400 mt-0.5">
              {birthdayDaysUntil === 0
                ? "The Everlasting Hills Church family celebrates you today."
                : "Wishing you a wonderful celebration ahead from the EHC family."}
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <StatCard title="My Attendance" iconEl={<CircleProgress value={overviewData?.attendance.percentage ?? 0} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {overviewData?.attendance.percentage ?? 0}<span className="text-lg font-bold">%</span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {overviewData
              ? `${overviewData.attendance.marked}/${overviewData.attendance.total} services`
              : "— services"}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Last: {fmtDate(overviewData?.attendance.lastMarkedAt ?? null, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </StatCard>

        <StatCard title="Attendance Streak" iconEl={<Zap size={18} />}>
          <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">
            {streakWeeks}<span className="text-base font-bold ml-1">Wk{streakWeeks !== 1 ? "s" : ""}</span>
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

        <StatCard title="Prayer Network" iconEl={<Heart size={16} />}>
          <p className="text-sm font-black text-gray-900 dark:text-white leading-snug mt-0.5">
            Active Intercessors
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Your active logs: {prayerCount}</p>
          <a
            href="/prayer-request"
            className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] flex items-center gap-0.5 mt-0.5 hover:underline"
          >
            Submit Request <ChevronRight size={11} />
          </a>
        </StatCard>

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
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mt-0.5">No upcoming service</p>
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

      {/* ── Profile Edit ─────────────────────────────────────────────────── */}
      {member && <ProfileEditCard member={member} initials={initials} />}

    </div>
  );
}
