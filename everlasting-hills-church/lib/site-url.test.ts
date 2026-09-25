import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = process.env.NEXT_PUBLIC_APP_URL;
const CANONICAL = "https://www.everlastinghills.church";

async function siteUrl(appUrl: string | undefined, apiUrl: string) {
  vi.resetModules();
  if (appUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = appUrl;
  vi.doMock("@/lib/api/backend-url", () => ({ getBackendBaseUrl: () => apiUrl }));
  const { getSiteUrl } = await import("./site-url");
  return getSiteUrl();
}

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL;
  vi.doUnmock("@/lib/api/backend-url");
});

describe("getSiteUrl", () => {
  // Production had NEXT_PUBLIC_APP_URL pointing at Cloud Run, which put the
  // API's hostname into every <loc> in sitemap.xml and every event canonical.
  it("refuses an app URL that is really the API's own host", async () => {
    const api = "https://ehc-backend-api-886498964135.europe-west1.run.app";

    expect(await siteUrl(api, api)).toBe(CANONICAL);
  });

  it("keeps a genuine site URL", async () => {
    expect(await siteUrl("https://www.everlastinghills.church", "https://api.example.com")).toBe(
      CANONICAL,
    );
    expect(await siteUrl("https://staging.everlastinghills.church", "https://api.example.com")).toBe(
      "https://staging.everlastinghills.church",
    );
  });

  // The API is normally the site's own origin plus /api/backend — sharing a
  // host there is expected and must not disqualify the site URL.
  it("allows the site URL when the API is a path on the same host", async () => {
    expect(
      await siteUrl(CANONICAL, "https://www.everlastinghills.church/api/backend"),
    ).toBe(CANONICAL);
  });

  it("falls back to the real site when nothing is configured", async () => {
    expect(await siteUrl(undefined, "https://api.example.com")).toBe(CANONICAL);
  });

  it("drops a trailing slash so joined paths do not double up", async () => {
    expect(await siteUrl("https://staging.everlastinghills.church/", "https://api.example.com")).toBe(
      "https://staging.everlastinghills.church",
    );
  });
});
