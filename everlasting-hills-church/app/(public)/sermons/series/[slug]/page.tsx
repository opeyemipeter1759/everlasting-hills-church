import { notFound } from "next/navigation";
import SeriesPage from "@/components/sermons/SeriesPage";
import { serverApi, type ApiError } from "@/lib/api/server";
import {
  toUiSermon,
  type SermonListItemRaw,
} from "@/lib/api/sermon-types";

export const revalidate = 300;

export default async function PublicSermonSeriesPage({
  params,
}: {
  params: { slug: string };
}) {
  let raw: SermonListItemRaw[];

  try {
    raw = await serverApi.get<SermonListItemRaw[]>(
      `/sermons/published?series=${encodeURIComponent(params.slug)}`,
      { withAuth: false, revalidate: 300 },
    );
  } catch (error) {
    if ((error as ApiError).status === 404) notFound();
    throw error;
  }

  if (raw.length === 0) notFound();

  return (
    <SeriesPage
      seriesName={raw[0].series ?? params.slug}
      seriesSlug={params.slug}
      sermons={raw.map(toUiSermon)}
    />
  );
}
