import MemberHome from "@/components/dashboard/member/MemberHome";
import type { StreakState } from "@/components/dashboard/member/member-home/types";
import { getMemberDisplayId, safeGet, type MeResponse } from "./shared";

interface SermonBookmark {
  Sermon: { slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null };
}
interface ListenHistoryItem {
  positionSec: number;
  completed: boolean;
  Sermon: { slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioDuration: number | null };
}
interface MemberAttendanceOverview {
  attendance: { marked: number; total: number; percentage: number; lastMarkedAt: string | null };
  streak: StreakState;
  coursesCompleted: number;
  sermonsCompleted: number;
}
interface CommunityBirthday {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  daysUntil: number;
}

const DEFAULT_STREAK: StreakState = {
  level: 1,
  title: "Seeker",
  task: { attendance: 1, course: 0, sermon: 0 },
  progress: { attendance: 0, course: 0, sermon: 0 },
  history: [],
};

export async function loadMemberDashboard(mePromise: Promise<MeResponse>) {
  const [me, bookmarksRaw, historyRaw, streakRaw, overviewRaw, announcementsRaw, communityFeedRaw, communityBirthdaysRaw] = await Promise.all([
    mePromise,
    safeGet<SermonBookmark[]>("/sermons/me/bookmarks"),
    safeGet<ListenHistoryItem[]>("/sermons/me/history"),
    safeGet<number>("/sermons/me/streak"),
    safeGet<MemberAttendanceOverview>("/overview/member"),
    safeGet<Array<{ id: string; title: string; body: string; imageUrl: string | null; createdAt: string }>>("/announcements/feed"),
    safeGet<Array<{ id: string; text: string; reactions: number; createdAt: string; authorName: string; authorPhotoUrl: string | null }>>("/community/feed"),
    safeGet<CommunityBirthday[]>("/members/birthdays/community?daysAhead=7"),
  ]);

  const bookmarks = bookmarksRaw?.map((b) => ({
    slug: b.Sermon.slug,
    title: b.Sermon.title,
    speaker: b.Sermon.speaker,
    date: b.Sermon.date,
    thumbnailUrl: b.Sermon.thumbnailUrl,
    audioUrl: b.Sermon.audioUrl,
  })) ?? [];

  const listenHistory = historyRaw?.map((p) => ({
    slug: p.Sermon.slug,
    title: p.Sermon.title,
    speaker: p.Sermon.speaker,
    date: p.Sermon.date,
    thumbnailUrl: p.Sermon.thumbnailUrl,
    positionSec: p.positionSec,
    completed: p.completed,
    audioDuration: p.Sermon.audioDuration,
  })) ?? [];

  const sermonStreak = typeof streakRaw === "number" ? streakRaw : 0;
  const attendanceRate  = overviewRaw?.attendance.percentage ?? 0;
  const attendanceCount = overviewRaw?.attendance.marked     ?? 0;
  const attendanceTotal = overviewRaw?.attendance.total       ?? 0;
  const lastServiceDate = overviewRaw?.attendance.lastMarkedAt ?? null;
  const streak = overviewRaw?.streak ?? DEFAULT_STREAK;
  const coursesCompleted = overviewRaw?.coursesCompleted ?? 0;
  const sermonsCompleted = overviewRaw?.sermonsCompleted ?? 0;

  let birthdayDaysUntil: number | null = null;
  if (me.member?.dateOfBirth) {
    // WAT (UTC+1) calendar day, read with UTC getters throughout — dateOfBirth is
    // stored at UTC midnight (see ehc-backend's birthday.util.ts), so mixing that
    // with local-timezone getters would silently shift the compared day depending
    // on the server's timezone. Mirrors ehc-backend/src/attendance/attendance.types.ts.
    const WAT_OFFSET_MS = 60 * 60 * 1000;
    const nowWat = new Date(Date.now() + WAT_OFFSET_MS);
    const today = new Date(Date.UTC(nowWat.getUTCFullYear(), nowWat.getUTCMonth(), nowWat.getUTCDate()));
    const dob = new Date(me.member.dateOfBirth);
    const thisYear = new Date(Date.UTC(nowWat.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
    const diff = Math.round((thisYear.getTime() - today.getTime()) / 86_400_000);
    if (diff >= 0 && diff <= 7) birthdayDaysUntil = diff;
  }

  return (
    <MemberHome
      member={
        me.member
          ? {
              id: me.member.id,
              firstName: me.member.firstName,
              lastName: me.member.lastName,
              email: me.member.email,
              phone: me.member.phone,
              address: me.member.address,
              dateOfBirth: me.member.dateOfBirth ? me.member.dateOfBirth.split("T")[0] : null,
              bio: me.member.bio,
              photoUrl: me.member.photoUrl,
            }
          : undefined
      }
      userEmail={me.member?.email ?? ""}
      memberDisplayId={getMemberDisplayId(me.member?.id)}
      sermonStreak={sermonStreak}
      bookmarks={bookmarks}
      listenHistory={listenHistory}
      birthdayDaysUntil={birthdayDaysUntil}
      attendanceRate={attendanceRate}
      attendanceCount={attendanceCount}
      attendanceTotal={attendanceTotal}
      lastServiceDate={lastServiceDate}
      streak={streak}
      coursesCompleted={coursesCompleted}
      sermonsCompleted={sermonsCompleted}
      nextService={null}
      hasCheckedInToday={false}
      todayService={null}
      prayerCount={0}
      recentServices={[]}
      monthlyAttendance={[]}
      announcements={announcementsRaw ?? []}
      communityBirthdays={communityBirthdaysRaw ?? []}
      ministryUnit={null}
      featuredSermon={null}
      pastorWord={null}
      dailyPrayer={null}
      communityFeed={communityFeedRaw ?? []}
      onlineCount={null}
      discipleshipMilestones={[]}
      memberSince={null}
      anniversaryDaysUntil={null}
    />
  );
}
