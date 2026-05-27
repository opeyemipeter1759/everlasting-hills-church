import type { MetadataRoute } from "next";

/**
 * Robots policy.
 *   - Public marketing + sermon pages → allowed
 *   - /dashboard, /me, /login, /api/* → disallowed (no value to search engines, just adds crawl cost)
 *
 * NEXT_PUBLIC_APP_URL is set in .env (defaults to localhost in dev).
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://everlastinghills.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/dashboard", "/dashboard/", "/me", "/me/", "/login", "/register", "/change-password", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
