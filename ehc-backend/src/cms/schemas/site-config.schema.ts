import { z } from 'zod';

/**
 * Site-wide settings (the "Site Settings" form). Church identity, contact,
 * socials, and footer — everything shared across every public page. Brand
 * colours are intentionally NOT editable here (locked to the brand palette).
 */

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => str(max).optional().default('');

export const SiteIdentitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  logoUrl: optStr(2000),
  faviconUrl: optStr(2000),

  contactEmail: optStr(254),
  contactPhone: optStr(40),
  address: optStr(300),

  socials: z
    .object({
      instagram: optStr(500),
      youtube: optStr(500),
      facebook: optStr(500),
      x: optStr(500),
      tiktok: optStr(500),
      whatsapp: optStr(500),
    })
    .default({ instagram: '', youtube: '', facebook: '', x: '', tiktok: '', whatsapp: '' }),

  mapsEmbedUrl: optStr(2000),
  footerTagline: optStr(300),
  legalLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        href: z.string().trim().min(1).max(200),
      }),
    )
    .max(10)
    .default([]),
});

export type SiteIdentity = z.infer<typeof SiteIdentitySchema>;

/** Seeded from the site's existing hardcoded values (config.ts + Footer.tsx). */
export const DEFAULT_SITE_IDENTITY: SiteIdentity = {
  name: 'Everlasting Hills Church',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  contactEmail: 'hello@everlastinghills.org',
  contactPhone: '+234 706 872 7719',
  address: 'Ibadan, Oyo State, Nigeria',
  socials: {
    instagram:
      'https://www.instagram.com/everlastinghillschurch?igsh=d2YwOWJlc2FtZnNs',
    youtube: 'https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g',
    facebook: 'https://www.facebook.com/share/1AwdEL3f52/',
    x: '',
    tiktok: 'https://www.tiktok.com/@everlasting_hills_church',
    whatsapp: 'https://wa.me/2347068727719',
  },
  mapsEmbedUrl: '',
  footerTagline: 'Raising men who flourish beyond limits.',
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};
