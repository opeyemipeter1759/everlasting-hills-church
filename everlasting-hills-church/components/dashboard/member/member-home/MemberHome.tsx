"use client";

import type { MemberHomePropsOptional } from "./types";
import { QrCheckinBanner } from "./QrCheckinBanner";
import { WelcomeHero } from "./WelcomeHero";
import { BirthdayBanner, AnniversaryBanner } from "./MilestoneBanners";
import { ScriptureCard } from "./ScriptureCard";
import { PastorWordCard } from "./PastorWordCard";
import { QuickActionsStrip } from "./QuickActionsStrip";
import { CheckInPanel } from "./CheckInPanel";
import { TodayInfoPanel } from "./TodayInfoPanel";
import { JourneyBand } from "./JourneyBand";
import { CommunityBirthdayPanel } from "./CommunityBirthdayPanel";
import { CommunityFeedPanel } from "./CommunityFeedPanel";
import { FeaturedSermonCard } from "./FeaturedSermonCard";
import { SermonLibraryCard } from "./SermonLibraryCard";
import { ContinueListeningCard } from "./ContinueListeningCard";
import AttendanceSection from "@/components/home/attendance-section";
import { AnnouncementsPanel } from "../AnnouncementsPanel";
import { ProfileCompletionToast } from "./ProfileCompletionToast";

export default function MemberHome(props: MemberHomePropsOptional) {
  const {
    member = null,
    userEmail = "",
    memberDisplayId = "EHC-NEW",
    attendanceRate = 0,
    attendanceCount = 0,
    streakWeeks = 0,
    lastServiceDate = null,
    nextService = null,
    hasCheckedInToday = false,
    todayService = null,
    prayerCount = 0,
    recentServices = [],
    monthlyAttendance = [],
    birthdayDaysUntil = null,
    sermonStreak = 0,
    bookmarks = [],
    listenHistory = [],
    announcements = [],
    communityBirthdays = [],
    ministryUnit = null,
    featuredSermon = null,
    pastorWord = null,
    communityFeed = [],
    onlineCount = null,
    discipleshipMilestones = [],
    memberSince = null,
    anniversaryDaysUntil = null,
  } = props;

  const displayName = member ? `${member.firstName} ${member.lastName}` : userEmail;
  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();

  const isServiceDay = !!todayService;
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
        streakWeeks={streakWeeks}
        nextService={nextService}
      />

 {/*      {birthdayDaysUntil !== null && (
        <BirthdayBanner firstName={firstName} daysUntil={birthdayDaysUntil} />
      )}

      {anniversaryDaysUntil !== null && memberSince && (
        <AnniversaryBanner firstName={firstName} memberSince={memberSince} daysUntil={anniversaryDaysUntil} />
      )} */}


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
           {/* {(sermonStreak > 0 || bookmarks.length > 0 || listenHistory.length > 0) && ( */}
        <div className="grid grid-cols-1  gap-5">
{/*           <SermonLibraryCard sermonStreak={sermonStreak} bookmarks={bookmarks} />
 */}          <ContinueListeningCard listenHistory={listenHistory} />
        </div>
{/*         
 */}        


      </div>

      {/* ═══════════════════════════════════════════════════════════
          BAND 3 — MY JOURNEY
          ═══════════════════════════════════════════════════════════ */}

      <JourneyBand
        isNewMember={isNewMember}
        member={member}
        prayerCount={prayerCount}
        ministryUnit={ministryUnit}
        attendanceRate={attendanceRate}
        attendanceCount={attendanceCount}
        lastServiceDate={lastServiceDate}
        recentServices={recentServices}
        streakWeeks={streakWeeks}
        nextService={nextService}
        discipleshipMilestones={discipleshipMilestones}
        monthlyAttendance={monthlyAttendance}
      />

      {/* ═══════════════════════════════════════════════════════════
          BAND 4 — COMMUNITY
          ═══════════════════════════════════════════════════════════ */}

   {/*    <CommunityBirthdayPanel communityBirthdays={communityBirthdays} />

      <CommunityFeedPanel feed={communityFeed} onlineCount={onlineCount} />
 */}
      {/* ═══════════════════════════════════════════════════════════
          BAND 5 — CONTENT
          ═══════════════════════════════════════════════════════════ */}

      {featuredSermon && <FeaturedSermonCard sermon={featuredSermon} />}
      <AnnouncementsPanel announcements={announcements}  />
    </div>
  );
}
