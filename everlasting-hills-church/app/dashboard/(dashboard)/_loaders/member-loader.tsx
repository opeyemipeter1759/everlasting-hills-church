import MemberHome from "@/components/dashboard/member/MemberHome";
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
}

/**
 * Personal dashboard for MEMBER (and roleless authenticated users).
 *
 * Real data: /sermons/me/{bookmarks,history,streak}, /auth/me, /overview/member (attendance).
 * Optional sections (announcements, feed, milestones) get empty defaults until endpoints are built.
 */
export async function loadMemberDashboard(me: MeResponse) {
  const [bookmarksRaw, historyRaw, streakRaw, overviewRaw, announcementsRaw] = await Promise.all([
    safeGet<SermonBookmark[]>("/sermons/me/bookmarks"),
    safeGet<ListenHistoryItem[]>("/sermons/me/history"),
    safeGet<number>("/sermons/me/streak"),
    safeGet<MemberAttendanceOverview>("/overview/member"),
    safeGet<Array<{ id: string; title: string; body: string; createdAt: string }>>("/announcements/feed"),
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

  // Real attendance data from /overview/member
  const attendanceRate  = overviewRaw?.attendance.percentage ?? 0;
  const attendanceCount = overviewRaw?.attendance.marked     ?? 0;
  const lastServiceDate = overviewRaw?.attendance.lastMarkedAt ?? null;

  // Birthday — derive days-until from DOB if within next 7 days
  let birthdayDaysUntil: number | null = null;
  if (me.member?.dateOfBirth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(me.member.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
    if (diff >= 0 && diff <= 7) birthdayDaysUntil = diff;
  }

  return (
    <MemberHome
      member={
        me.member
          ? {
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
      lastServiceDate={lastServiceDate}
      streakWeeks={0}
      nextService={null}
      hasCheckedInToday={false}
      todayService={null}
      prayerCount={0}
      recentServices={[]}
      monthlyAttendance={[]}
      announcements={announcementsRaw ?? []}
      communityBirthdays={[]}
      ministryUnit={null}
      featuredSermon={null}
      pastorWord={null}
      dailyPrayer={null}
      communityFeed={[]}
      onlineCount={null}
      discipleshipMilestones={[]}
      memberSince={null}
      anniversaryDaysUntil={null}
    />
  );
}
