import { getAllSermons } from "@/services/sermon.service";
import SermonList from "@/components/dashboard/admin/SermonList";

export default async function SermonsPage() {
  const sermons = await getAllSermons();
  const serialised = sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date.toISOString(),
    status: s.status as "DRAFT" | "PUBLISHED" | "SCHEDULED",
    isFeatured: s.isFeatured,
    playCount: s.playCount,
    scriptureRef: s.scriptureRef,
    series: s.series,
    _count: s._count,
  }));
  return <SermonList sermons={serialised} />;
}
