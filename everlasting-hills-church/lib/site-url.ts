import { getBackendBaseUrl } from "@/lib/api/backend-url";

/** Where the public site actually lives. The apex redirects here. */
const CANONICAL_SITE_URL = "https://www.everlastinghills.church";

function strip(value: string): string {
  return value.replace(/\/$/, "");
}

/**
 * The public website's own origin — what belongs in canonical links, the
 * sitemap, robots.txt and OpenGraph URLs.
 *
 * This is deliberately not a bare read of NEXT_PUBLIC_APP_URL. That variable
 * was pointing at the Cloud Run API on production, which put the API's
 * hostname into every <loc> in sitemap.xml and into the canonical of every
 * event page — telling search engines the church's site lives on an API
 * domain that serves no pages. A value that resolves to the API is therefore
 * ignored rather than trusted: for these four uses it can only ever be wrong.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return CANONICAL_SITE_URL;

  const candidate = strip(configured);
  let api = "";
  try {
    api = strip(getBackendBaseUrl());
  } catch {
    // No API configured — nothing to compare against, so trust what we have.
    return candidate;
  }

  // The API base is often the site origin plus /api/backend, so compare hosts
  // rather than whole URLs: a candidate sharing the API's host is the API.
  try {
    if (new URL(candidate).host === new URL(api).host && !api.includes("/api/")) {
      return CANONICAL_SITE_URL;
    }
  } catch {
    return CANONICAL_SITE_URL;
  }

  return candidate;
}
