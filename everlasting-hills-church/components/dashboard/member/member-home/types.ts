export interface MemberHomeProps {
  member: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
  } | null;
  userEmail: string;
  memberDisplayId: string;
  attendanceRate: number;
  attendanceCount: number;
  streakWeeks: number;
  lastServiceDate: string | null;
  nextService: { name: string; scheduledAt: string } | null;
  hasCheckedInToday: boolean;
  todayService: { id: string; name: string; sermonTitle?: string | null } | null;
  prayerCount: number;
  recentServices: Array<{ name: string; scheduledAt: string; totalAttended: number }>;
  monthlyAttendance: Array<{ label: string; attended: number; total: number }>;
  birthdayDaysUntil: number | null;
  sermonStreak: number;
  bookmarks: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null }>;
  listenHistory: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; positionSec: number; completed: boolean; audioDuration: number | null }>;
  // New optional props — null/empty defaults; no backend required yet
  announcements?: Array<{ id: string; title: string; body: string; createdAt: string }>;
  communityBirthdays?: Array<{ firstName: string; lastName: string; photoUrl: string | null }>;
  ministryUnit?: { name: string; nextServingDate: string | null } | null;
  featuredSermon?: {
    slug: string; title: string; speaker: string; date: string;
    thumbnailUrl: string | null; audioUrl: string | null; description?: string | null;
  } | null;
  pastorWord?: { text: string; audioUrl?: string | null } | null;
  dailyPrayer?: string | null;
  communityFeed?: Array<{
    id: string; authorName: string; authorPhotoUrl: string | null;
    text: string; createdAt: string; reactions: number;
  }>;
  onlineCount?: number | null;
  discipleshipMilestones?: Array<{ label: string; completedAt: string | null }>;
  memberSince?: string | null;
  anniversaryDaysUntil?: number | null;
}

export type MemberHomePropsOptional = Partial<MemberHomeProps>;

export type FeedPost = NonNullable<MemberHomeProps["communityFeed"]>[number];
