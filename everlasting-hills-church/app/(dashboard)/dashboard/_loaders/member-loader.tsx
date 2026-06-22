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

/**
 * Personal dashboard for MEMBER (and roleless authenticated users).
 *
 * Real data sources today: /sermons/me/{bookmarks,history,streak} + /auth/me member info.
 * Unbuilt sections (attendance, services, prayer count) get explicit zeros so MemberHome's
 * intrinsic empty-state branches render — no misleading dummy numbers.
 */
export async function loadMemberDashboard(me: MeResponse) {
  const [bookmarksRaw, historyRaw, streakRaw] = await Promise.all([
    safeGet<SermonBookmark[]>("/sermons/me/bookmarks"),
    safeGet<ListenHistoryItem[]>("/sermons/me/history"),
    safeGet<number>("/sermons/me/streak"),
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
      attendanceRate={0}
      attendanceCount={0}
      streakWeeks={0}
      lastServiceDate={null}
      nextService={null}
      hasCheckedInToday={false}
      todayService={null}
      prayerCount={0}
      recentServices={[]}
      monthlyAttendance={[]}
      // New optional props — wire up to real endpoints as they become available
      announcements={[]}
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
