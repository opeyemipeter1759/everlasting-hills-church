/**
 * Server-side helper for homepage content.
 *
 * One source — GET /site-settings (NestJS, cached for 5 min in-process). The
 * homepage uses `getAllSiteSettings()` once per request; section components are
 * dumb display components that take their content as a prop.
 *
 * Type strategy: we mirror the Zod-inferred shapes from the backend here as
 * plain TypeScript types. Slightly duplicative but keeps the frontend free of
 * a Zod runtime dependency for read-only consumption. If a shape drifts, the
 * frontend will still render with the fallback defaults below.
 */

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/frontend-session";
import { cookies } from "next/headers";

/* ── Type mirrors (kept in sync with ehc-backend/src/site-settings/schemas) ── */

export interface Cta {
  label: string;
  href: string;
}

export interface HeroContent {
  headline: string;
  headlineAccent: string;
  subtext: string;
  scriptureBadge: { visible: boolean; text: string };
  ctaPrimary: Cta;
  ctaSecondary: Cta;
  carouselImages: string[];
  mediaCard: { eyebrow: string; title: string; subtitle: string };
}

export interface AboutContent {
  label: string;
  headline: string;
  headlineAccent: string;
  paragraphs: string[];
  gallery: { src: string; name: string }[];
  ctaPrimary: Cta;
  ctaSecondary: Cta;
}

export interface CultureCard {
  headline: string;
  body: string;
  verseRef: string;
  verseText: string;
}

export interface CultureContent {
  label: string;
  headline: string;
  subtext: string;
  cards: [CultureCard, CultureCard, CultureCard];
}

export interface ScripturePillar {
  phrase: string;
  detail: string;
}

export interface ScriptureContent {
  label: string;
  headline: string;
  subtext: string;
  pillars: [ScripturePillar, ScripturePillar, ScripturePillar, ScripturePillar];
  bottomQuote: { text: string; reference: string };
}

export type ServiceDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface ServiceSlot {
  label: string;
  day: ServiceDay;
  startTime: string;
  endTime: string;
  liveStartTime: string;
  description: string;
}

export interface ServiceContent {
  services: ServiceSlot[];
  locationName: string;
  address: string | null;
  mapsLink: string | null;
  specialAnnouncement: string | null;
}

export interface SermonsContent {
  label: string;
  headline: string;
  subtext: string;
  viewAllCta: Cta;
  displayCount: number;
}

export interface CommunityContent {
  label: string;
  headline: string;
  paragraphs: string[];
  ctaPrimary: Cta;
  ctaSecondary: Cta;
  visualCard: { eyebrow: string; headline: string; tagline: string };
  statCard: { title: string; subtitle: string };
}

export interface GivingImpactTile {
  eyebrow: string;
  title: string;
  copy: string;
}

export interface GivingContent {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  body: string;
  impactTiles: [GivingImpactTile, GivingImpactTile, GivingImpactTile];
  waysToGive: { title: string; description: string }[];
  badge: { visible: boolean; text: string };
  cta: Cta;
  footnote: string | null;
}

export interface ContactContent {
  whatsapp: { visible: boolean; label: string; url: string };
  instagram: { visible: boolean; handle: string; url: string };
  email: { visible: boolean; address: string };
  youtube: { visible: boolean; url: string | null };
  facebook: { visible: boolean; url: string | null };
  twitter: { visible: boolean; url: string | null };
}

export interface SiteSettingsMap {
  HERO: HeroContent;
  ABOUT: AboutContent;
  CULTURE: CultureContent;
  SCRIPTURE: ScriptureContent;
  SERVICE: ServiceContent;
  SERMONS: SermonsContent;
  COMMUNITY: CommunityContent;
  GIVING: GivingContent;
  CONTACT: ContactContent;
}

export type SiteSectionName = keyof SiteSettingsMap;

/* ── Fallback defaults — mirror the backend seed so a missing/stale fetch
   still renders the same homepage. ─────────────────────────────────────────── */

export const HERO_FALLBACK: HeroContent = {
  headline: "The warmth of home",
  headlineAccent: "before you arrive.",
  subtext:
    "Experience joyful worship and a peaceful place where hearts are heard. A community rooted in the Word and alive in the Spirit.",
  scriptureBadge: { visible: true, text: "Genesis 49:22–26" },
  ctaPrimary: { label: "Plan Your Visit", href: "#services" },
  ctaSecondary: { label: "Watch Service", href: "#sermons" },
  carouselImages: [
    "/images/church_congregation_1_1779193592146.png",
    "/images/church_congregation_2_1779193607195.png",
    "/images/church_congregation_3_1779193624434.png",
    "/images/church_congregation_4_1779193639860.png",
    "/images/church_congregation_3_1779193624434.png",
    "/images/church_congregation_4_1779193639860.png",
  ],
  mediaCard: {
    eyebrow: "Weekly Gathering",
    title: "Join the Rhythm",
    subtitle: "Experience the pulse of praise.",
  },
};

export const ABOUT_FALLBACK: AboutContent = {
  label: "Who We Are",
  headline: "Built on the Word.",
  headlineAccent: "Alive in the Spirit.",
  paragraphs: [
    "We exist to help people genuinely encounter Christ — not as a distant doctrine, but as a living, present reality.",
    "The Word of God is the foundation beneath everything we do, and the Holy Spirit is our daily source of strength. We are a family committed to growing deeply in Scripture, living by the Spirit, and flourishing together. You don’t just attend here — you belong here.",
  ],
  gallery: [
    {
      name: "Mountain lake",
      src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80&auto=format&fit=crop",
    },
    {
      name: "Forest light",
      src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80&auto=format&fit=crop",
    },
    {
      name: "Green hills",
      src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80&auto=format&fit=crop",
    },
    {
      name: "Mountain road",
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop",
    },
  ],
  ctaPrimary: { label: "Join the Family", href: "#community" },
  ctaSecondary: { label: "Our Culture", href: "#culture" },
};

export const CULTURE_FALLBACK: CultureContent = {
  label: "Our Culture",
  headline: "What we are about",
  subtext: "Three convictions at the heart of everything we do.",
  cards: [
    {
      headline: "Shaped by Scripture",
      body: "We are formed by the truth of God’s Word. Everything we do — how we think, love, and live — flows from a sincere engagement with Scripture.",
      verseRef: "2 Tim. 3:16",
      verseText:
        "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.",
    },
    {
      headline: "Alive in the Spirit",
      body: "We depend on the life and power of the Holy Spirit for everything. He is not a concept — He is the reason we move, breathe, and minister.",
      verseRef: "John 4:24",
      verseText:
        "God is spirit, and those who worship him must worship in spirit and truth.",
    },
    {
      headline: "Family, Not a Crowd",
      body: "We grow as a family, not just as a gathering. Real relationships, shared lives, and genuine accountability — that’s the community we build.",
      verseRef: "Acts 2:44",
      verseText:
        "And all who believed were together and had all things in common.",
    },
  ],
};

export const SCRIPTURE_FALLBACK: ScriptureContent = {
  label: "Our Identity",
  headline: "Rooted in a promise",
  subtext:
    "Our name and calling come from Genesis 49:22–26 — a prophecy of fruitfulness, divine strength, and blessings that reach the everlasting hills.",
  pillars: [
    {
      phrase: "Fruitful by the well",
      detail:
        "Like a vine planted near water, we are meant to bear fruit — abundant, overflowing, and lasting.",
    },
    {
      phrase: "Branches over the wall",
      detail:
        "Our reach is beyond ordinary limits. Blessing flows outward into families, cities, and generations.",
    },
    {
      phrase: "Strengthened by the Mighty One",
      detail:
        "When the archers attack, it is God who steadies our arms. Our strength is not self-made.",
    },
    {
      phrase: "Blessings to the everlasting hills",
      detail:
        "The promises on our lives are ancient, enduring, and greater than any mountain. They belong to eternity.",
    },
  ],
  bottomQuote: {
    text: "The blessings of your father… are stronger than the blessings of the ancient mountains, than the bounty of the everlasting hills.",
    reference: "Genesis 49:26",
  },
};

export const SERVICE_FALLBACK: ServiceContent = {
  services: [
    {
      label: "Sunday Service",
      day: "sunday",
      startTime: "09:00",
      endTime: "12:00",
      liveStartTime: "08:45",
      description: "Main worship service — teaching, prayer, and the family gathered.",
    },
    {
      label: "Midweek Bible Study",
      day: "wednesday",
      startTime: "17:30",
      endTime: "20:00",
      liveStartTime: "17:15",
      description: "Verse-by-verse Bible study and prayer.",
    },
  ],
  locationName: "Ibadan, Nigeria",
  address: "Akobo, Ibadan",
  mapsLink: null,
  specialAnnouncement: null,
};

export const SERMONS_FALLBACK: SermonsContent = {
  label: "Sermons",
  headline: "Listen, replay, grow",
  subtext:
    "Recent messages from our gatherings — keep walking in the Word through the week.",
  viewAllCta: { label: "View all sermons", href: "/sermons" },
  displayCount: 3,
};

export const COMMUNITY_FALLBACK: CommunityContent = {
  label: "You Belong Here",
  headline: "Become part of something real",
  paragraphs: [
    "Community at Everlasting Hills is not a program. It is a way of life. We are people who genuinely do life together — in worship, in prayer, in celebration, and in the hard seasons.",
    "Whether you are taking your very first step of faith or you have walked with God for decades, there is a place for you here.",
  ],
  ctaPrimary: { label: "I’m New Here", href: "#contact" },
  ctaSecondary: { label: "Join a Community", href: "#contact" },
  visualCard: {
    eyebrow: "You are welcome",
    headline: "A family that prays, grows, and stays",
    tagline:
      "No background check. No dress code. Just come, and you will belong.",
  },
  statCard: { title: "Real Community", subtitle: "Not just a service" },
};

export const GIVING_FALLBACK: GivingContent = {
  eyebrow: "Sow into the hills",
  headline: "Plant where you receive.",
  headlineAccent: "you receive",
  body: "Like a vine planted near water, every gift bears fruit — and the branches reach over the wall, into families, cities, and generations we may never meet.",
  impactTiles: [
    {
      eyebrow: "Fruit by the well",
      title: "Local life",
      copy: "Pastoral care, weekly worship, & a family that gathers.",
    },
    {
      eyebrow: "Branches over the wall",
      title: "Outreach",
      copy: "Serving Ibadan and beyond — beyond ordinary limits.",
    },
    {
      eyebrow: "Ancient & enduring",
      title: "Generations",
      copy: "Building a house that outlives a single season.",
    },
  ],
  waysToGive: [
    { title: "Bank transfer", description: "Direct to ministry — no platform cut." },
    {
      title: "In-service offering",
      description: "Bring your gift at Sunday or Wednesday gathering.",
    },
    {
      title: "Designated giving",
      description: "Building, outreach, or specific ministries.",
    },
  ],
  badge: { visible: true, text: "Zero gateway fees" },
  cta: { label: "See account details", href: "/give" },
  footnote: "Stewardship statements published yearly",
};

export const CONTACT_FALLBACK: ContactContent = {
  whatsapp: {
    visible: true,
    label: "Chat with us on WhatsApp",
    url: "#",
  },
  instagram: {
    visible: true,
    handle: "@everlastinghillschurch",
    url: "#",
  },
  email: { visible: true, address: "hello@everlastinghills.org" },
  youtube: { visible: false, url: null },
  facebook: { visible: false, url: null },
  twitter: { visible: false, url: null },
};

const FALLBACKS: SiteSettingsMap = {
  HERO: HERO_FALLBACK,
  ABOUT: ABOUT_FALLBACK,
  CULTURE: CULTURE_FALLBACK,
  SCRIPTURE: SCRIPTURE_FALLBACK,
  SERVICE: SERVICE_FALLBACK,
  SERMONS: SERMONS_FALLBACK,
  COMMUNITY: COMMUNITY_FALLBACK,
  GIVING: GIVING_FALLBACK,
  CONTACT: CONTACT_FALLBACK,
};

/* ── Fetcher ─────────────────────────────────────────────────────────────── */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

interface ServerEnvelope<T> {
  data: T;
}

interface SectionRow {
  section: SiteSectionName;
  content: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Fetch every section in one round-trip.
 *
 * - `revalidate: 300` so Next caches per-route for 5 minutes (matches backend cache).
 * - On any error (network, server down, schema mismatch), we return the bundled
 *   fallbacks so the homepage never breaks. Errors are logged in dev.
 */
export async function getAllSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const res = await fetch(`${BASE_URL}/site-settings`, {
      next: { revalidate: 300, tags: ["site-settings"] },
    });
    if (!res.ok) {
      console.warn(`[site-settings] GET returned ${res.status}, using fallbacks`);
      return FALLBACKS;
    }
    const body = (await res.json()) as ServerEnvelope<Record<SiteSectionName, SectionRow>>;
    const raw = body?.data ?? ({} as Record<SiteSectionName, SectionRow>);

    const out = { ...FALLBACKS };
    for (const key of Object.keys(FALLBACKS) as SiteSectionName[]) {
      const row = raw[key];
      if (row && row.content && typeof row.content === "object") {
        // We trust the backend Zod validator on writes; reads are best-effort.
        // Spread over fallback so any missing nested key inherits the default.
        (out[key] as unknown) = { ...(FALLBACKS[key] as object), ...row.content };
      }
    }
    return out;
  } catch (err) {
    console.warn("[site-settings] fetch failed, using fallbacks:", (err as Error).message);
    return FALLBACKS;
  }
}

/**
 * Admin-side fetch — one section, fresh, with the caller's JWT.
 * Used by the /dashboard/settings/homepage editor.
 */
export async function getSectionForAdmin<S extends SiteSectionName>(
  section: S,
): Promise<SiteSettingsMap[S]> {
  const jar = cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(`${BASE_URL}/site-settings/${section.toLowerCase()}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    return FALLBACKS[section];
  }
  const body = (await res.json()) as ServerEnvelope<SectionRow>;
  const merged = {
    ...(FALLBACKS[section] as object),
    ...((body?.data?.content as object) ?? {}),
  };
  return merged as SiteSettingsMap[S];
}
