import SermonAnalytics from "@/components/dashboard/admin/SermonAnalytics";
import { serverApi } from "@/lib/api/server";

export const metadata = { title: "Sermon Analytics — Dashboard" };

/**
 * Sermon analytics page. Middleware enforces PASTOR+.
 */
interface AnalyticsResponse {
  sermons: Array<{
    id: string;
    title: string;
    slug: string;
    speaker: string;
    date: string;
    playCount: number;
    series: string | null;
    _count: {
      SermonReaction: number;
      SermonBookmark: number;
      SermonComment: number;
      SermonNote: number;
      ListenProgress: number;
    };
    reactionsByType: { LIKE: number; AMEN: number; CONVICTED: number };
    completedListens: number;
    completionRate: number;
    discussion: { questionCount: number; responseCount: number; questionsWithResponses: number };
  }>;
  totalSubscribers: number;
  totalReactions: number;
  totalBookmarks: number;
  totalListens: number;
}

export default async function SermonAnalyticsPage() {
  const analytics = await serverApi.get<AnalyticsResponse>("/sermons/analytics", {
    cache: "no-store",
  });

  const sermons = analytics.sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date,
    playCount: s.playCount,
    series: s.series,
    reactions: s._count.SermonReaction,
    bookmarks: s._count.SermonBookmark,
    comments: s._count.SermonComment,
    notes: s._count.SermonNote,
    listens: s._count.ListenProgress,
    reactionsByType: s.reactionsByType,
    completedListens: s.completedListens,
    completionRate: s.completionRate,
    discussion: s.discussion,
  }));

  return (
    <SermonAnalytics
      sermons={sermons}
      totalSubscribers={analytics.totalSubscribers}
      totalReactions={analytics.totalReactions}
      totalBookmarks={analytics.totalBookmarks}
      totalListens={analytics.totalListens}
    />
  );
}
