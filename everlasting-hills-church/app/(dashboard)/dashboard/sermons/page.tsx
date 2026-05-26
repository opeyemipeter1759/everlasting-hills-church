import SermonList from "@/components/dashboard/admin/SermonList";
import { serverApi } from "@/lib/api/server";
import { SermonListItemRaw, toUiCount } from "@/lib/api/sermon-types";

/**
 * Admin sermon list. Middleware ensures only PASTOR+ reaches this page (see middleware.ts
 * + getRequiredRole), so no in-page auth check needed.
 *
 * Cache: 'no-store' — admins expect to see their just-published sermon immediately.
 */

interface AdminSermonItem extends SermonListItemRaw {
  isFeatured: boolean;
}

export default async function SermonsPage() {
  const sermons = await serverApi.get<AdminSermonItem[]>("/sermons/admin", {
    cache: "no-store",
  });

  const serialised = sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date,
    status: s.status,
    isFeatured: s.isFeatured,
    playCount: s.playCount,
    scriptureRef: s.scriptureRef,
    series: s.series,
    _count: toUiCount(s._count),
  }));

  return <SermonList sermons={serialised} />;
}
