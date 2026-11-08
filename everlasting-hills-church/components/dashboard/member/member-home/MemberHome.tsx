"use client";
import type { MemberHomePropsOptional, StreakState } from "./types";
import { QrCheckinBanner } from "./QrCheckinBanner";
import { WelcomeHero } from "./WelcomeHero";
import { BirthdayCard } from "./BirthdayCard";
import { QuickActionsStrip } from "./QuickActionsStrip";
import { CheckInPanel } from "./CheckInPanel";
import { WarmAttendanceStat } from "./WarmAttendanceStat";
import { WarmStreakStat } from "./WarmStreakStat";
import { FeaturedSermonCard } from "./FeaturedSermonCard";
import { ContinueListeningCard } from "./ContinueListeningCard";
import { GatheringsPanel } from "./GatheringsPanel";
import { AnnouncementsPanel } from "../AnnouncementsPanel";
import { ProfileCompletionToast } from "./ProfileCompletionToast";
import TodayReadingCard from "../reading-plan/TodayReadingCard";
import DailyScriptureCard from "./DailyScriptureCard";
import { PledgeAppeal } from "./PledgeAppeal";
import { PushOptInCard } from "./PushOptInCard";
import { EvangelismTallyCard } from "./EvangelismTallyCard";
import { PrayerWatchCard } from "./PrayerWatchCard";
import { OneOnOneCard } from "./OneOnOneCard";
import { SpouseRequestsInbox } from "@/components/dashboard/settings/SpouseLink";
import LatestSermonSummary from "@/components/sermon-digest/LatestSermonSummary";
import { DashboardColumns, MainColumn, SideColumn, Tile } from "@/components/ui/layout/DashboardColumns";

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
    recentServices = [],
    listenHistory = [],
    announcements = [],
    birthdayDaysUntil = null,
    communityBirthdays = [],
    ministryUnit = null,
    featuredSermon = null,
  } = props;

  const displayName = member ? `${member.firstName} ${member.lastName}` : userEmail;
  const firstName = member?.firstName ?? displayName.split(" ")[0];
  const initials = member
    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    : (userEmail[0] ?? "M").toUpperCase();


  return (
    <div className="max-w-full space-y-5">
      {/* Notices: only shown when there is something to act on. */}
      <div className="space-y-3 empty:hidden">
        <ProfileCompletionToast member={member} />
        <QrCheckinBanner />
        <SpouseRequestsInbox />
        <PushOptInCard />
      </div>

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

      {/* Wide column and narrow column stack independently: no card sets another's height. */}
      <DashboardColumns>
        <MainColumn>
          <Tile order={1}><PledgeAppeal member={member} userEmail={userEmail} /></Tile>
          <Tile order={3}><DailyScriptureCard /></Tile>
          <Tile order={6}><TodayReadingCard /></Tile>
          <Tile order={9}><AnnouncementsPanel announcements={announcements} /></Tile>
          <Tile order={12}><LatestSermonSummary compact /></Tile>
          {featuredSermon && <Tile order={14}><FeaturedSermonCard sermon={featuredSermon} /></Tile>}
          <Tile order={15}><GatheringsPanel /></Tile>
        </MainColumn>

        <SideColumn>
          <Tile order={2}>
            <CheckInPanel todayService={todayService} hasCheckedInToday={hasCheckedInToday} nextService={nextService} />
          </Tile>
          <Tile order={4}>
            <WarmStreakStat
              memberDisplayId={memberDisplayId}
              streak={streak}
              coursesCompleted={coursesCompleted}
              sermonsCompleted={sermonsCompleted}
              nextService={nextService}
              ministryUnit={ministryUnit}
            />
          </Tile>
          <Tile order={5}><PrayerWatchCard /></Tile>
          <Tile order={7}>
            <WarmAttendanceStat
              attendanceRate={attendanceRate}
              attendanceCount={attendanceCount}
              attendanceTotal={attendanceTotal}
              lastServiceDate={lastServiceDate}
              recentServices={recentServices}
            />
          </Tile>
          <Tile order={8}><ContinueListeningCard listenHistory={listenHistory} /></Tile>
          <Tile order={10}>
            <BirthdayCard memberId={member?.id ?? null} birthdayDaysUntil={birthdayDaysUntil} communityBirthdays={communityBirthdays} />
          </Tile>
          <Tile order={11}><OneOnOneCard /></Tile>
          <Tile order={13}><EvangelismTallyCard /></Tile>
        </SideColumn>
      </DashboardColumns>
    </div>
  );
}
