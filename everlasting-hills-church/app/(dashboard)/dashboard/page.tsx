import { LayoutDashboard } from "lucide-react";
import ComingSoon from "@/components/dashboard/shell/ComingSoon";
import MemberHome from '@/components/dashboard/member/MemberHome'
import React from 'react'

export const metadata = { title: "Dashboard — Everlasting Hills Church" };

/**
 * Dashboard landing page.
 *
 * The previous implementation called Prisma + Supabase directly from a Server Component
 * with three branches (MEMBER / UNIT_LEAD / ADMIN+) and ~25 DB queries. That was the file
 * that prompted the architecture review.
 *
 * It's been simplified to a placeholder while the corresponding NestJS modules
 * (Members, Attendance, Analytics, Sermons-member, Units) are rebuilt.
 *
 * Auth/role enforcement still happens in middleware.ts — only authenticated users with
 * MEMBER+ reach this page.
 *
 * Week 3+ plan:
 *   1. Build the missing NestJS modules
 *   2. Reintroduce role-specific dashboard views (MemberHome, UnitLeadHome, AdminOverview)
 *      each fetching from their own backend endpoint instead of running Prisma directly.
 */
export default function DashboardPage() {
  return (
    <ComingSoon
      title="Dashboard overview"
      description="Your personalized dashboard is being rebuilt against the new NestJS backend. Sermon management and the public sermon library are live — use the sidebar to navigate."
      icon={LayoutDashboard}
    <div>
      <MemberHome/>
    </div>
  )
}










/* import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db/prisma";
import { getLast6Months } from "@/services/analytics.service";
import { getUpcomingBirthdays, getAbsentMembers, getMemberWithProfile } from "@/services/member.service";
import {
  getMemberAttendance,
  getTodayService,
  getNextService,
  countTotalServices,
  getRecentServicesStats,
  countTodayCheckIns,
} from "@/services/attendance.service";
import { getMemberBookmarks, getMemberListenHistory, getSermonStreak } from "@/services/sermon.service";
import { getUnitMemberAttendance, getDepartmentStats } from "@/services/department-analytics.service";

import AdminOverview from "@/components/dashboard/AdminOverview";
import MemberHome from "@/components/dashboard/member/MemberHome";
import UnitLeadHome from "@/components/dashboard/UnitLeadHome";
import type { VisitorRow, MemberRow, AdminStats } from "@/components/dashboard/AdminOverview";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

// ── Member display ID ──────────────────────────────────────────────────────────
function getMemberDisplayId(id: string) {
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

// ── Attendance streak ──────────────────────────────────────────────────────────
function calculateStreakWeeks(records: Array<{ service: { scheduledAt: Date } }>) {
  if (!records.length) return 0;
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const weekStarts = new Set<number>();
  for (const r of records) {
    const d = new Date(r.service.scheduledAt);
    d.setHours(0, 0, 0, 0);
    const ws = new Date(d.getTime() - d.getDay() * 86400000);
    weekStarts.add(ws.getTime());
  }
  const sorted = Array.from(weekStarts).sort((a, b) => b - a);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWS = new Date(now.getTime() - now.getDay() * 86400000);
  if (sorted[0] < currentWS.getTime() - MS_PER_WEEK) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] - sorted[i] === MS_PER_WEEK) streak++;
    else break;
  }
  return streak;
}

// ── Admin/Pastor/Super-admin data ─────────────────────────────────────────────
async function fetchAdminData() {
  const supabase = createAdminClient();
  const [
    { count: visitorsCount },
    { count: prayersCount },
    { count: membersCount },
    { data: visitors },
    { data: members },
  ] = await Promise.all([
    supabase.from("Visitor").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase.from("PrayerRequest").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase.from("Member").select("*", { count: "exact", head: true }).eq("tenantId", TENANT_ID),
    supabase
      .from("Visitor")
      .select("id, firstName, lastName, email, phone, gender, attendanceType, membershipInterest, howDidYouLearn, locatedInIbadan, bornAgain, occupation, submittedAt")
      .eq("tenantId", TENANT_ID)
      .order("submittedAt", { ascending: false })
      .limit(10),
    supabase
      .from("Member")
      .select("id, firstName, lastName, email, phone, joinedAt")
      .eq("tenantId", TENANT_ID)
      .order("joinedAt", { ascending: false })
      .limit(10),
  ]);

  const [todayCheckIns, birthdayFeed, absentMembers] = await Promise.all([
    countTodayCheckIns(),
    getUpcomingBirthdays(7),
    getAbsentMembers(3),
  ]);

  return {
    stats: {
      members: membersCount ?? 0,
      visitors: visitorsCount ?? 0,
      todayCheckIns,
      prayers: prayersCount ?? 0,
    } satisfies AdminStats,
    recentVisitors: (visitors ?? []) as VisitorRow[],
    recentMembers: (members ?? []) as MemberRow[],
    memberEmails: ((members ?? []) as Array<{ email: string | null }>)
      .map((m) => m.email)
      .filter((e): e is string => typeof e === "string" && e.length > 0),
    birthdayFeed: birthdayFeed.map((b: typeof birthdayFeed[number]) => ({
      id: b.id,
      firstName: b.firstName,
      lastName: b.lastName,
      daysUntil: b.daysUntil,
      photoUrl: b.photoUrl,
    })),
    absentMembers: absentMembers.map((a: typeof absentMembers[number]) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
    })),
  };
}

// ── Member data ────────────────────────────────────────────────────────────────
async function fetchMemberData(userId: string) {
  const [
    profileWithMember,
    attendanceRecords,
    todayService,
    nextService,
    totalServices,
    recentServices,
    bookmarksRaw,
    listenHistoryRaw,
    sermonStreak,
  ] = await Promise.all([
    getMemberWithProfile(userId),
    getMemberAttendance(userId),
    getTodayService(),
    getNextService(),
    countTotalServices(),
    getRecentServicesStats(24),
    getMemberBookmarks(userId),
    getMemberListenHistory(userId),
    getSermonStreak(userId),
  ]);

  const member = profileWithMember?.member ?? null;

  const attendanceCount = attendanceRecords.length;
  const attendanceRate =
    totalServices > 0 ? Math.min(100, Math.round((attendanceCount / totalServices) * 100)) : 0;
  const streakWeeks = calculateStreakWeeks(attendanceRecords);
  const lastRecord = attendanceRecords[0] ?? null;
  const lastServiceDate = lastRecord ? lastRecord.service.scheduledAt.toISOString() : null;
  const hasCheckedInToday = todayService
    ? attendanceRecords.some((r) => r.serviceId === todayService.id)
    : false;

  const memberId = member?.id ?? userId;
  const memberDisplayId = getMemberDisplayId(memberId);
  const displayName = member
    ? `${member.firstName} ${member.lastName}`
    : "Member";
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : "M";

  let prayerCount = 0;
  if (member?.email) {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("PrayerRequest")
      .select("*", { count: "exact", head: true })
      .eq("tenantId", TENANT_ID)
      .eq("email", member.email);
    prayerCount = count ?? 0;
  }

  const months = getLast6Months();
  const attendedServiceIds = new Set(attendanceRecords.map((r) => r.serviceId));
  const monthlyAttendance = months.map((m) => {
    const monthServices = recentServices.filter(
      (s) => s.scheduledAt >= m.start && s.scheduledAt < m.end
    );
    const attended = monthServices.filter((s) => attendedServiceIds.has(s.id)).length;
    return { label: m.label, attended, total: monthServices.length };
  });

  let birthdayDaysUntil: number | null = null;
  if (member?.dateOfBirth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(member.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
    if (diff >= 0 && diff <= 7) birthdayDaysUntil = diff;
  }

  return {
    member: member
      ? {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          address: member.address,
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().split("T")[0] : null,
          bio: member.bio ?? null,
          photoUrl: member.photoUrl ?? null,
        }
      : null,
    userEmail: profileWithMember?.userId ?? userId,
    memberDisplayId,
    displayName,
    initials,
    attendanceRate,
    attendanceCount,
    streakWeeks,
    lastServiceDate,
    nextService: nextService
      ? { name: nextService.name, scheduledAt: nextService.scheduledAt.toISOString() }
      : null,
    hasCheckedInToday,
    todayService: todayService ? { id: todayService.id, name: todayService.name } : null,
    prayerCount,
    recentServices: recentServices.map((s) => ({
      name: s.name,
      scheduledAt: s.scheduledAt.toISOString(),
      totalAttended: s._count.attendance,
    })),
    monthlyAttendance,
    birthdayDaysUntil,
    sermonStreak,
    bookmarks: bookmarksRaw.map((b: typeof bookmarksRaw[number]) => ({
      slug: b.sermon.slug,
      title: b.sermon.title,
      speaker: b.sermon.speaker,
      date: b.sermon.date.toISOString(),
      thumbnailUrl: b.sermon.thumbnailUrl,
      audioUrl: b.sermon.audioUrl,
    })),
    listenHistory: listenHistoryRaw.map((p: typeof listenHistoryRaw[number]) => ({
      slug: p.sermon.slug,
      title: p.sermon.title,
      speaker: p.sermon.speaker,
      date: p.sermon.date.toISOString(),
      thumbnailUrl: p.sermon.thumbnailUrl,
      positionSec: p.positionSec,
      completed: p.completed,
      audioDuration: p.sermon.audioDuration,
    })),
  };
}

// ── Unit lead data ─────────────────────────────────────────────────────────────
async function fetchUnitLeadData(profileId: string) {
  const unitMembership = await db.unitMember.findFirst({
    where: { tenantId: TENANT_ID, isLead: true, member: { profileId } },
    include: { unit: true, member: { select: { firstName: true } } },
  });

  if (!unitMembership) return null;

  const unitId = unitMembership.unitId;
  const [deptStats, unitMembers, nextService] = await Promise.all([
    getDepartmentStats(unitId),
    getUnitMemberAttendance(unitId, 3),
    getNextService(),
  ]);

  const dept = deptStats[0];
  const atRisk = unitMembers.filter((m) => m.rate < 40 && m.status === "ACTIVE").length;

  return {
    firstName: unitMembership.member.firstName,
    unitName: unitMembership.unit.name,
    totalMembers: dept?.totalMembers ?? 0,
    activeMembers: dept?.activeMembers ?? 0,
    attendanceRate: dept?.attendanceRate ?? 0,
    membersNeedingAttention: atRisk,
    unitMembers,
    nextService: nextService
      ? { name: nextService.name, scheduledAt: nextService.scheduledAt.toISOString() }
      : null,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    include: { member: true },
  });
  if (!profile) redirect("/login");

  const role = profile.role;

  // ── MEMBER view ─────────────────────────────────────────────────────────────
  if (role === Role.MEMBER) {
    const data = await fetchMemberData(user.id);
    return (
      <MemberHome
        member={data.member}
        userEmail={user.email ?? ""}
        memberDisplayId={data.memberDisplayId}
        attendanceRate={data.attendanceRate}
        attendanceCount={data.attendanceCount}
        streakWeeks={data.streakWeeks}
        lastServiceDate={data.lastServiceDate}
        nextService={data.nextService}
        hasCheckedInToday={data.hasCheckedInToday}
        todayService={data.todayService}
        prayerCount={data.prayerCount}
        recentServices={data.recentServices}
        monthlyAttendance={data.monthlyAttendance}
        birthdayDaysUntil={data.birthdayDaysUntil}
        sermonStreak={data.sermonStreak}
        bookmarks={data.bookmarks}
        listenHistory={data.listenHistory}
      />
    );
  }

  // ── UNIT_LEAD view ───────────────────────────────────────────────────────────
  if (role === Role.UNIT_LEAD) {
    const data = await fetchUnitLeadData(profile.id);

    if (!data) {
      // Unit lead not assigned to a unit yet — fall back to member view
      const memberData = await fetchMemberData(user.id);
      return (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
            You have the Unit Lead role but are not assigned as lead to any unit yet. Ask an admin to assign you in the Units section.
          </div>
          <MemberHome
            member={memberData.member}
            userEmail={user.email ?? ""}
            memberDisplayId={memberData.memberDisplayId}
            attendanceRate={memberData.attendanceRate}
            attendanceCount={memberData.attendanceCount}
            streakWeeks={memberData.streakWeeks}
            lastServiceDate={memberData.lastServiceDate}
            nextService={memberData.nextService}
            hasCheckedInToday={memberData.hasCheckedInToday}
            todayService={memberData.todayService}
            prayerCount={memberData.prayerCount}
            recentServices={memberData.recentServices}
            monthlyAttendance={memberData.monthlyAttendance}
            birthdayDaysUntil={memberData.birthdayDaysUntil}
            sermonStreak={memberData.sermonStreak}
            bookmarks={memberData.bookmarks}
            listenHistory={memberData.listenHistory}
          />
        </div>
      );
    }

    return (
      <UnitLeadHome
        firstName={data.firstName}
        unitName={data.unitName}
        totalMembers={data.totalMembers}
        activeMembers={data.activeMembers}
        attendanceRate={data.attendanceRate}
        membersNeedingAttention={data.membersNeedingAttention}
        unitMembers={data.unitMembers}
        nextService={data.nextService}
      />
    );
  }

  // ── ADMIN / PASTOR / SUPER_ADMIN view ────────────────────────────────────────
  const [data, firstName] = await Promise.all([
    fetchAdminData(),
    Promise.resolve(profile.member?.firstName ?? null),
  ]);

  return (
    <AdminOverview
      userName={firstName}
      stats={data.stats}
      recentVisitors={data.recentVisitors}
      recentMembers={data.recentMembers}
      memberEmails={data.memberEmails}
      birthdayFeed={data.birthdayFeed}
      absentMembers={data.absentMembers}
    />
  );
}
