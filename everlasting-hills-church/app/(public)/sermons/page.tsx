import PublicSermonList from "@/components/sermons/PublicSermonList";
import { serverApi } from "@/lib/api/server";
import {
  SeriesListItem,
  SermonListItemRaw,
  toUiSermon,
} from "@/lib/api/sermon-types";

export const metadata = { title: "Sermons — Everlasting Hills Church" };

/**
 * Opt out of build-time prerendering — depends on a running NestJS backend.
 * Switch back to ISR (`revalidate = 60`) in Week 3 once the backend is part of CI/build infra
 * and we want pre-rendered HTML for SEO.
 */
export const dynamic = "force-dynamic";

/**
 * Public sermons index.
 *
 * Server Component. Hits NestJS published-sermons + series endpoints in parallel.
 * Both endpoints are @Public on the backend, so withAuth=false skips the cookie lookup.
 * `revalidate: 60` lets Next.js ISR cache the rendered HTML for 60s — a sermon list
 * doesn't change minute-to-minute, but we don't want stale-by-an-hour either.
 */
export default async function SermonsPage() {
  const [sermons, series] = await Promise.all([
    serverApi.get<SermonListItemRaw[]>("/sermons/published", {
      withAuth: false,
      revalidate: 60,
    }),
    serverApi.get<SeriesListItem[]>("/sermons/series", {
      withAuth: false,
      revalidate: 60,
    }),
  ]);

  const serialised = sermons.map(toUiSermon);

  const serialisedSeries = series
    .filter((s) => s.series && s.seriesSlug)
    .map((s) => ({ name: s.series!, slug: s.seriesSlug! }));

  return <PublicSermonList sermons={serialised} series={serialisedSeries} />;
}
