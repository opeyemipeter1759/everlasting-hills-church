/**
 * Every public page that reads the CMS, checked end to end at the component
 * level: each page is handed CMS content with a marker on every piece of text,
 * and the test checks that the marked text is what renders, so the page
 * shows the CMS copy and not its built-in copy. It also checks each page asks
 * for a key the backend serves (an unknown key 404s and falls back silently,
 * which is how Cultures and Events lost their CMS content).
 */
import fs from "fs";
import path from "path";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const MARK = "CMSX·";
const calls: { key: string; valid: boolean; marked: string[] }[] = [];

/** Every human-readable string in the fallback, with the marker in front (image paths and URLs left alone). */
function mark(value: unknown, out: string[]): unknown {
  if (typeof value === "string") {
    if (!value.trim() || value.startsWith("/") || /^https?:/.test(value)) return value;
    out.push(MARK + value);
    return MARK + value;
  }
  if (Array.isArray(value)) return value.map((v) => mark(v, out));
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mark(v, out)]));
  }
  return value;
}

vi.mock("@/lib/cms-page", () => ({
  getStructuredContent: async (key: string, opts: { fallback: unknown; valid: (c: unknown) => boolean }) => {
    const marked: string[] = [];
    const content = mark(opts.fallback, marked);
    calls.push({ key, valid: opts.valid(content), marked });
    return content;
  },
}));

// Stand-ins for interactive widgets: they print whatever the page hands them.
const Dump = (props: Record<string, unknown>) => <pre>{JSON.stringify(props)}</pre>;
vi.mock("next/image", () => ({ default: (p: { alt?: string }) => <span role="img" aria-label={p.alt ?? ""} /> }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));
vi.mock("@/components/home/ScrollReveal", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ministries/GroupFinder", () => ({ default: () => null }));
vi.mock("@/components/ministries/MinistriesCards", async (orig) => ({ ...(await orig<object>()), default: Dump }));
vi.mock("@/components/home/CosmicContactHero", () => ({ default: Dump }));
vi.mock("@/components/give/GiveClient", () => ({ default: Dump }));
vi.mock("@/components/home/events/Eventpage/EventsPageClient", () => ({ default: Dump }));
vi.mock("@/lib/api/server", () => ({ serverApi: { get: async () => [] } }));
vi.mock("@/lib/site-config", () => ({ getSiteConfig: async () => ({ contactEmail: "office@example.org" }) }));

/** The CMS keys the backend serves, read from its page registry so the two can't drift apart. */
const BACKEND_KEYS = new Set(
  Array.from(
    fs.readFileSync(path.resolve(__dirname, "../../ehc-backend/src/cms/page-registry.ts"), "utf8").matchAll(/\{ key: '([^']+)'/g),
    (m) => m[1],
  ),
);

const sp = { searchParams: {} };
const PAGES: [string, string, () => Promise<ReactElement>][] = [
  ["/about", "about", async () => (await import("@/app/(public)/about/page")).default(sp)],
  ["/cultures", "about/cultures", async () => (await import("@/app/(public)/cultures/page")).default(sp)],
  ["/contact", "contact", async () => (await import("@/app/(public)/contact/page")).default(sp)],
  ["/give", "give", async () => (await import("@/app/(public)/give/page")).default(sp)],
  ["/ministries", "ministries", async () => (await import("@/app/(public)/ministries/page")).default(sp)],
  ...(["mens", "womens", "teens", "couples"] as const).map((slug): [string, string, () => Promise<ReactElement>] => [
    `/ministries/${slug}`,
    `ministries/${slug}`,
    async () =>
      (await import("@/app/(public)/ministries/[slug]/page")).default({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) }),
  ]),
  ["/privacy", "privacy", async () => (await import("@/app/(public)/privacy/page")).default(sp)],
  ["/terms", "terms", async () => (await import("@/app/(public)/terms/page")).default(sp)],
  ["/visit", "visit", async () => (await import("@/app/(public)/visit/page")).default(sp)],
  ["/events", "events", async () => (await import("@/components/home/events/Eventpage/EventPage")).default()],
];

beforeEach(() => {
  calls.length = 0;
});

describe("public pages show their CMS content", () => {
  it.each(PAGES)("%s reads the CMS page %s and renders it", async (_route, key, load) => {
    const { container } = render(await load());
    const text = container.textContent ?? "";

    expect(calls.map((c) => c.key)).toEqual([key]);
    expect(BACKEND_KEYS.has(key)).toBe(true);
    // The page's own check must accept CMS content, or it silently shows built-in copy.
    expect(calls[0].valid).toBe(true);

    const shown = calls[0].marked.filter((s) => text.includes(s.slice(0, 28)) || text.includes(JSON.stringify(s).slice(1, 29)));
    expect(shown.length).toBeGreaterThanOrEqual(Math.min(3, calls[0].marked.length));
  });
});
