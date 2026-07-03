/**
 * Server-side helper for site-wide settings (identity, contact, socials, footer).
 * Reads GET /cms/site-config (public). On any error, returns bundled fallbacks so
 * the public site never breaks. Cached per-route with a CMS cache tag.
 */

export interface SiteIdentity {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socials: {
    instagram: string;
    youtube: string;
    facebook: string;
    x: string;
    tiktok: string;
    whatsapp: string;
  };
  mapsEmbedUrl: string;
  footerTagline: string;
  legalLinks: { label: string; href: string }[];
}

export const SITE_IDENTITY_FALLBACK: SiteIdentity = {
  name: "Everlasting Hills Church",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  contactEmail: "hello@everlastinghills.org",
  contactPhone: "+234 706 872 7719",
  address: "Ibadan, Oyo State, Nigeria",
  socials: {
    instagram: "https://www.instagram.com/everlastinghillschurch?igsh=d2YwOWJlc2FtZnNs",
    youtube: "https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g",
    facebook: "https://www.facebook.com/share/1AwdEL3f52/",
    x: "",
    tiktok: "https://www.tiktok.com/@everlasting_hills_church",
    whatsapp: "https://wa.me/2347068727719",
  },
  mapsEmbedUrl: "",
  footerTagline: "Raising men who flourish beyond limits.",
  legalLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:4000";

export async function getSiteConfig(): Promise<SiteIdentity> {
  try {
    const res = await fetch(`${BASE_URL}/cms/site-config`, {
      next: { revalidate: 300, tags: ["cms:site-config"] },
    });
    if (!res.ok) return SITE_IDENTITY_FALLBACK;
    const body = (await res.json()) as { data?: { content?: Partial<SiteIdentity> } };
    const content = body?.data?.content;
    if (!content || typeof content !== "object") return SITE_IDENTITY_FALLBACK;
    // Spread over fallback so any missing key inherits the default.
    return {
      ...SITE_IDENTITY_FALLBACK,
      ...content,
      socials: { ...SITE_IDENTITY_FALLBACK.socials, ...(content.socials ?? {}) },
      legalLinks: content.legalLinks?.length ? content.legalLinks : SITE_IDENTITY_FALLBACK.legalLinks,
    };
  } catch {
    return SITE_IDENTITY_FALLBACK;
  }
}
