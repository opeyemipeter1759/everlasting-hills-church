import { notFound } from "next/navigation";
import { getPublishedSermons, getSeriesList } from "@/services/sermon.service";
import SeriesPage from "@/components/sermons/SeriesPage";

export async function generateMetadata({ params }: { params: { seriesSlug: string } }) {
  const seriesList = await getSeriesList();
  const found = seriesList.find((s) => s.seriesSlug === params.seriesSlug);
  if (!found) return {};
  return {
    title: `${found.series} — Sermon Series · Everlasting Hills Church`,
    description: `All messages in the ${found.series} series.`,
  };
}

export default async function SermonSeriesPage({ params }: { params: { seriesSlug: string } }) {
  const [sermons, seriesList] = await Promise.all([
    getPublishedSermons({ series: params.seriesSlug }),
    getSeriesList(),
  ]);

  const seriesEntry = seriesList.find((s) => s.seriesSlug === params.seriesSlug);
  if (!seriesEntry) notFound();

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

  return (
    <SeriesPage
      seriesName={seriesEntry.series!}
      seriesSlug={params.seriesSlug}
      sermons={serialised}
    />
  );
}
