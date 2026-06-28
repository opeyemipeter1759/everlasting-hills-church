import SermonAnalytics from "@/components/dashboard/admin/SermonAnalytics";
import { serverApi } from "@/lib/api/server";
import { SermonCountRaw, toUiCount } from "@/lib/api/sermon-types";

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
    _count: SermonCountRaw;
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

  const topSermons = analytics.sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date,
    playCount: s.playCount,
    series: s.series,
    _count: toUiCount(s._count),
  }));

  return (
    <SermonAnalytics
      topSermons={topSermons}
      totalSubscribers={analytics.totalSubscribers}
      totalReactions={analytics.totalReactions}
      totalBookmarks={analytics.totalBookmarks}
      totalListens={analytics.totalListens}
    />
  );
}
