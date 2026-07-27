"use client";

import type { MemberHomePropsOptional, StreakState } from "./types";
import { QrCheckinBanner } from "./QrCheckinBanner";
import { WelcomeHero } from "./WelcomeHero";
import { QuickActionsStrip } from "./QuickActionsStrip";
import { CheckInPanel } from "./CheckInPanel";
import { JourneyBand } from "./JourneyBand";
import { FeaturedSermonCard } from "./FeaturedSermonCard";
import { ContinueListeningCard } from "./ContinueListeningCard";
import { AnnouncementsPanel } from "../AnnouncementsPanel";
import { ProfileCompletionToast } from "./ProfileCompletionToast";

const DEFAULT_STREAK: StreakState = {
  level: 1,
  title: "Seeker",
  task: { attendance: 1, course: 0, sermon: 0 },
  progress: { attendance: 0, course: 0, sermon: 0 },
  history: [],
};

export default function MemberHome(props: MemberHomePropsOptional) {
  const {
    member = null,
    userEmail = "",
    memberDisplayId = "EHC-NEW",
    attendanceRate = 0,
    attendanceCount = 0,
    attendanceTotal = 0,
    streak = DEFAULT_STREAK,
    coursesCompleted = 0,
    sermonsCompleted = 0,
    lastServiceDate = null,
    nextService = null,
    hasCheckedInToday = false,
    todayService = null,
    prayerCount = 0,
    recentServices = [],
    monthlyAttendance = [],
    listenHistory = [],
    announcements = [],
    ministryUnit = null,
    featuredSermon = null,
    discipleshipMilestones = [],
  } = props;

  const displayName = member ? `${member.firstName} ${member.lastName}` : userEmail;
  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();

  const isNewMember = attendanceCount === 0 && prayerCount === 0;

  return (
    <div className="space-y-5 max-w-6xl">
      <ProfileCompletionToast member={member} />
      <QrCheckinBanner />
      <WelcomeHero
        firstName={firstName}
        initials={initials}
        photoUrl={member?.photoUrl ?? null}
        memberDisplayId={memberDisplayId}
        attendanceRate={attendanceRate}
        streak={streak}
        nextService={nextService}
      />

      <QuickActionsStrip />

      {/* ═══════════════════════════════════════════════════════════
          BAND 2 — TODAY
          ═══════════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CheckInPanel
          todayService={todayService}
          hasCheckedInToday={hasCheckedInToday}
          nextService={nextService}
        />
        <div className="grid grid-cols-1 gap-5">
          <ContinueListeningCard listenHistory={listenHistory} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BAND 3 — MY JOURNEY
          ═══════════════════════════════════════════════════════════ */}

      <JourneyBand
        isNewMember={isNewMember}
        member={member}
        memberDisplayId={memberDisplayId}
        prayerCount={prayerCount}
        ministryUnit={ministryUnit}
        attendanceRate={attendanceRate}
        attendanceCount={attendanceCount}
        attendanceTotal={attendanceTotal}
        lastServiceDate={lastServiceDate}
        recentServices={recentServices}
        streak={streak}
        coursesCompleted={coursesCompleted}
        sermonsCompleted={sermonsCompleted}
        nextService={nextService}
        discipleshipMilestones={discipleshipMilestones}
        monthlyAttendance={monthlyAttendance}
      />

      {/* ═══════════════════════════════════════════════════════════
          BAND 5 — CONTENT
          ═══════════════════════════════════════════════════════════ */}

      {featuredSermon && <FeaturedSermonCard sermon={featuredSermon} />}
      <AnnouncementsPanel announcements={announcements} />
    </div>
  );
}
