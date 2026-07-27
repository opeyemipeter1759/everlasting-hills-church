export interface TaskRequirement {
  attendance: number;
  course: number;
  sermon: number;
}

export interface PassedLevel {
  level: number;
  title: string;
  task: TaskRequirement;
}

/** 2go-style leveling ladder — see OverviewService.getMemberOverview / streak-ladder.ts
 * on the backend. Endless: level N's task is generated, not read from a fixed table. */
export interface StreakState {
  level: number;
  title: string;
  task: TaskRequirement;
  progress: TaskRequirement;
  /** Every level already cleared, oldest first. */
  history: PassedLevel[];
}

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
  /** Total service days (Sundays + Wednesdays) in the current month. */
  attendanceTotal: number;
  streak: StreakState;
  coursesCompleted: number;
  sermonsCompleted: number;
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
