import type { StreakState } from "@/components/dashboard/member/member-home/types";
import type { CanMarkResponse } from "@/lib/api";
import type { DailyScripture } from "@/lib/api/daily-scripture";
import type { EvangelismTally } from "@/lib/api/evangelism";
import type { MySpouse } from "@/lib/api/family";
import type { Gathering } from "@/lib/api/gatherings";
import type { MyRequest } from "@/lib/api/one-on-one";
import type { Pledge } from "@/lib/api/pledges";
import type { MySignupView, PublicWatch } from "@/lib/api/prayer-watch";
import type { ReadingSubscription, TodayReading } from "@/lib/api/reading-plan";
import type { LatestSummary } from "@/lib/sermon-digest";
import type { MeResponse } from "../shared";

type SermonCard = { slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null };

/**
 * GET /member-home: everything on the member dashboard's home page in one
 * request. A section is null when it has nothing, or when it failed to load;
 * failed ones are named in `unavailable`, and those cards fetch for themselves.
 */
export interface MemberHomeData {
  me: MeResponse | null;
  bookmarks: Array<{ Sermon: SermonCard & { audioUrl: string | null } }> | null;
  listenHistory: Array<{ positionSec: number; completed: boolean; Sermon: SermonCard & { audioDuration: number | null } }> | null;
  sermonStreak: number | null;
  overview: {
    attendance: { marked: number; total: number; percentage: number; lastMarkedAt: string | null };
    streak: StreakState;
    coursesCompleted: number;
    sermonsCompleted: number;
  } | null;
  announcements: Array<{ id: string; title: string; body: string; imageUrl: string | null; createdAt: string; eventTime: string | null; venue: string | null }> | null;
  communityFeed: Array<{ id: string; text: string; reactions: number; createdAt: string; authorName: string; authorPhotoUrl: string | null }> | null;
  communityBirthdays: Array<{ id: string; firstName: string; lastName: string; photoUrl: string | null; daysUntil: number }> | null;
  spouse: MySpouse | null;
  pledge: Pledge | null;
  pledgeCampaign: string;
  evangelismTally: EvangelismTally | null;
  prayerWatch: MySignupView | null;
  /** The current watch and all its slots (the night's watches). */
  prayerWatchCurrent: PublicWatch | null;
  oneOnOneRequests: MyRequest[] | null;
  readingPlan: { today: TodayReading | null; subscriptions: ReadingSubscription[] | null };
  canMark: CanMarkResponse | null;
  gatherings: Gathering[] | null;
  scripture: { today: DailyScripture | null; translations: Array<{ code: string; name: string; isDefault: boolean }> | null };
  latestSermon: LatestSummary | null;
  /** Sections that failed on the server, e.g. "scriptureToday". */
  unavailable: string[];
}
