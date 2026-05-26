import { notFound } from "next/navigation";
import SeriesPage from "@/components/sermons/SeriesPage";
import { serverApi } from "@/lib/api/server";
import {
  SeriesListItem,
  SermonListItemRaw,
  toUiSermon,
} from "@/lib/api/sermon-types";

// Render on-demand; backend may not be reachable at build time
export const dynamic = "force-dynamic";

interface PageParams {
  params: { seriesSlug: string };
}

export async function generateMetadata({ params }: PageParams) {
  const series = await serverApi.get<SeriesListItem[]>("/sermons/series", {
    withAuth: false,
    revalidate: 60,
  });
  const found = series.find((s) => s.seriesSlug === params.seriesSlug);
  if (!found?.series) return {};
  return {
    title: `${found.series} — Sermon Series · Everlasting Hills Church`,
    description: `All messages in the ${found.series} series.`,
  };
}

export default async function SermonSeriesPage({ params }: PageParams) {
  const [sermons, series] = await Promise.all([
    serverApi.get<SermonListItemRaw[]>(
      `/sermons/published?series=${encodeURIComponent(params.seriesSlug)}`,
      { withAuth: false, revalidate: 60 },
    ),
    serverApi.get<SeriesListItem[]>("/sermons/series", {
      withAuth: false,
      revalidate: 60,
    }),
  ]);

  const seriesEntry = series.find((s) => s.seriesSlug === params.seriesSlug);
  if (!seriesEntry?.series) notFound();

  return (
    <SeriesPage
      seriesName={seriesEntry.series}
      seriesSlug={params.seriesSlug}
      sermons={sermons.map(toUiSermon)}
    />
  );
}
