import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberWithProfile } from "@/services/member.service";
import { isAdmin } from "@/lib/auth/rbac";
import { getSermonAnalytics } from "@/services/sermon.service";
import SermonAnalytics from "@/components/dashboard/admin/SermonAnalytics";

export const metadata = { title: "Sermon Analytics — Dashboard" };

export default async function SermonAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getMemberWithProfile(user.id);
  if (!profile || !isAdmin(profile.role)) redirect("/me");

  const { sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens } =
    await getSermonAnalytics();

  const topSermons = sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date.toISOString(),
    playCount: s.playCount,
    series: s.series,
    _count: s._count,
  }));

  return (
    <SermonAnalytics
      topSermons={topSermons}
      totalSubscribers={totalSubscribers}
      totalReactions={totalReactions}
      totalBookmarks={totalBookmarks}
      totalListens={totalListens}
    />
  );
}
