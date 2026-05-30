import type { MetadataRoute } from "next";
import { serverApi } from "@/lib/api/server";

/**
 * Dynamic sitemap. Lists static public routes + every published sermon and series.
 *
 * Note: this is fetched at request time when crawled (Next.js generates sitemap.xml
 * on demand). If the backend is down at crawl time, we degrade to the static routes
 * so we don't 500 the sitemap.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://everlastinghills.org";

interface PublishedSermon {
  slug: string;
  date: string;
}
interface PublishedSeries {
  series: string | null;
  seriesSlug: string | null;
  date: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/sermons`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/connect`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/first-timer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/prayer-request`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/testimony`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/give`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/questions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  let sermonEntries: MetadataRoute.Sitemap = [];
  let seriesEntries: MetadataRoute.Sitemap = [];

  try {
    const [sermons, series] = await Promise.all([
      serverApi.get<PublishedSermon[]>("/sermons/published", { withAuth: false, cache: "no-store" }),
      serverApi.get<PublishedSeries[]>("/sermons/series", { withAuth: false, cache: "no-store" }),
    ]);

    sermonEntries = sermons.map((s) => ({
      url: `${SITE_URL}/sermons/${s.slug}`,
      lastModified: new Date(s.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    seriesEntries = series
      .filter((s) => s.seriesSlug)
      .map((s) => ({
        url: `${SITE_URL}/sermons/series/${s.seriesSlug}`,
        lastModified: new Date(s.date),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
  } catch {
    // Backend unreachable → return static routes only. Better than a broken sitemap.
  }

  return [...staticRoutes, ...sermonEntries, ...seriesEntries];
}
