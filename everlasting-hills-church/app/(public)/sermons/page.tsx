import { getPublishedSermons, getSeriesList } from "@/services/sermon.service";
import PublicSermonList from "@/components/sermons/PublicSermonList";

export const metadata = { title: "Sermons — Everlasting Hills Church" };

export default async function SermonsPage() {
  const [sermons, series] = await Promise.all([
    getPublishedSermons(),
    getSeriesList(),
  ]);

  const serialised = sermons.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    speaker: s.speaker,
    date: s.date.toISOString(),
    scriptureRef: s.scriptureRef,
    series: s.series,
    seriesSlug: s.seriesSlug,
    description: s.description,
    audioUrl: s.audioUrl,
    videoUrl: s.videoUrl,
    thumbnailUrl: s.thumbnailUrl,
    playCount: s.playCount,
    tags: s.tags,
    _count: s._count,
  }));

  const serialisedSeries = series.map((s) => ({
    name: s.series!,
    slug: s.seriesSlug!,
  }));

  return <PublicSermonList sermons={serialised} series={serialisedSeries} />;
}
