import { z } from 'zod';

/**
 * Zod schemas for every editable homepage section.
 *
 * One source of truth: the GET/PUT endpoints, the seed function, and the future
 * admin editor all import from here. The shapes here describe the JSON payload
 * stored in `site_settings.content` (per section row).
 *
 * Design rules:
 *   - "Structure doesn't change, content does." Where a section's design depends
 *     on a fixed count (3 culture cards, 4 scripture pillars, 3 giving impact
 *     tiles), the field is a Zod TUPLE so validation rejects out-of-shape input.
 *   - Brand identity stays in code, not in settings. Pillar names (Word / Spirit
 *     / Community) and pillar numbers (01–04) are positional in the components.
 *   - Length caps everywhere. An admin who pastes a paragraph into a headline
 *     field gets a 400 before they break the layout.
 */

/* ── Shared primitives ─────────────────────────────────────────────────────── */

/**
 * A link the admin can paste anywhere. Accepts anchor (#…), relative (/…),
 * full URLs, mailto:, tel:, and wa.me/. Empty strings rejected — use a
 * sibling visibility flag if a channel should be hidden.
 */
const linkSchema = z
  .string()
  .trim()
  .min(1, 'Link is required')
  .max(500)
  .refine(
    (v) =>
      v.startsWith('#') ||
      v.startsWith('/') ||
      /^https?:\/\//i.test(v) ||
      /^mailto:/i.test(v) ||
      /^tel:/i.test(v),
    'Must be an anchor (#…), relative path (/…), URL, mailto:, or tel:',
  );

/** Accepts both `/images/foo.png` (local) and `https://cdn…/foo.jpg` (R2). */
const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (v) => v.startsWith('/') || /^https?:\/\//i.test(v),
    'Must be a relative path or absolute URL',
  );

/** "HH:MM" 24-hour clock, 00:00–23:59. */
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM (24-hour)');

/** Every CTA in every section uses this shape. */
const ctaSchema = z.object({
  label: z.string().trim().min(1).max(40),
  href: linkSchema,
});

/* ── 1. HERO ───────────────────────────────────────────────────────────────── */

export const HeroContentSchema = z.object({
  headline: z.string().trim().min(1).max(120),
  /** Italic gradient phrase that flows after the headline ("before you arrive."). */
  headlineAccent: z.string().trim().min(1).max(60),
  subtext: z.string().trim().min(1).max(400),
  scriptureBadge: z.object({
    visible: z.boolean(),
    text: z.string().trim().min(1).max(60),
  }),
  ctaPrimary: ctaSchema,
  ctaSecondary: ctaSchema,
  carouselImages: z.array(imageUrlSchema).min(1).max(12),
  mediaCard: z.object({
    eyebrow: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(60),
    subtitle: z.string().trim().min(1).max(120),
  }),
});

/* ── 2. ABOUT ──────────────────────────────────────────────────────────────── */

export const AboutContentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  /** Burgundy second line under the main headline. */
  headlineAccent: z.string().trim().min(1).max(80),
  paragraphs: z.array(z.string().trim().min(1).max(1000)).min(1).max(4),
  gallery: z
    .array(
      z.object({
        src: imageUrlSchema,
        name: z.string().trim().min(1).max(60),
      }),
    )
    .min(1)
    .max(12),
  ctaPrimary: ctaSchema,
  ctaSecondary: ctaSchema,
});

/* ── 3. CULTURE (fixed 3 cards: Word, Spirit, Community) ──────────────────── */

export const CultureCardSchema = z.object({
  headline: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(600),
  verseRef: z.string().trim().min(1).max(40),
  verseText: z.string().trim().min(1).max(600),
});

export const CultureContentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  subtext: z.string().trim().min(1).max(300),
  /** Exactly 3 cards. Index 0 = Word, 1 = Spirit (inverted), 2 = Community. */
  cards: z.tuple([CultureCardSchema, CultureCardSchema, CultureCardSchema]),
});

/* ── 4. SCRIPTURE (fixed 4 pillars) ───────────────────────────────────────── */

export const ScripturePillarSchema = z.object({
  phrase: z.string().trim().min(1).max(80),
  detail: z.string().trim().min(1).max(400),
});

export const ScriptureContentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  subtext: z.string().trim().min(1).max(400),
  pillars: z.tuple([
    ScripturePillarSchema,
    ScripturePillarSchema,
    ScripturePillarSchema,
    ScripturePillarSchema,
  ]),
  bottomQuote: z.object({
    text: z.string().trim().min(1).max(400),
    reference: z.string().trim().min(1).max(40),
  }),
});

/* ── 5. SERVICE ────────────────────────────────────────────────────────────── */

export const ServiceSlotSchema = z.object({
  label: z.string().trim().min(1).max(60),
  day: z.enum([
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  liveStartTime: timeOfDaySchema,
  description: z.string().trim().min(1).max(160),
});

export const ServiceContentSchema = z.object({
  services: z.array(ServiceSlotSchema).min(1).max(8),
  locationName: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300).nullable(),
  mapsLink: z.union([z.string().trim().url().max(500), z.null()]),
  /** Null when nothing special; otherwise the override banner copy. */
  specialAnnouncement: z.string().trim().min(1).max(280).nullable(),
});

/* ── 6. SERMONS (chrome only — sermon cards come from /sermons/latest) ─────── */

export const SermonsContentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  subtext: z.string().trim().min(1).max(400),
  viewAllCta: ctaSchema,
  /** How many sermons to fetch from the sermons table for the homepage strip. */
  displayCount: z.number().int().min(1).max(12),
});

/* ── 7. COMMUNITY ──────────────────────────────────────────────────────────── */

export const CommunityContentSchema = z.object({
  label: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  paragraphs: z.array(z.string().trim().min(1).max(600)).min(1).max(3),
  ctaPrimary: ctaSchema,
  ctaSecondary: ctaSchema,
  visualCard: z.object({
    eyebrow: z.string().trim().min(1).max(40),
    headline: z.string().trim().min(1).max(120),
    tagline: z.string().trim().min(1).max(200),
  }),
  statCard: z.object({
    title: z.string().trim().min(1).max(40),
    subtitle: z.string().trim().min(1).max(60),
  }),
});

/* ── 8. GIVING (bank details live on /give, not here) ─────────────────────── */

export const GivingImpactTileSchema = z.object({
  eyebrow: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(40),
  copy: z.string().trim().min(1).max(200),
});

export const GivingWayRowSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(160),
});

export const GivingContentSchema = z.object({
  eyebrow: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  headlineAccent: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(500),
  impactTiles: z.tuple([
    GivingImpactTileSchema,
    GivingImpactTileSchema,
    GivingImpactTileSchema,
  ]),
  waysToGive: z.array(GivingWayRowSchema).min(1).max(6),
  badge: z.object({
    visible: z.boolean(),
    text: z.string().trim().min(1).max(40),
  }),
  cta: ctaSchema,
  footnote: z.string().trim().max(200).nullable(),
});

/* ── 9. CONTACT ────────────────────────────────────────────────────────────── */

const channelBase = z.object({ visible: z.boolean() });

export const ContactContentSchema = z.object({
  whatsapp: channelBase.extend({
    label: z.string().trim().min(1).max(60),
    url: linkSchema,
  }),
  instagram: channelBase.extend({
    handle: z.string().trim().min(1).max(60),
    url: linkSchema,
  }),
  email: channelBase.extend({
    address: z.string().trim().email().max(254),
  }),
  youtube: channelBase.extend({ url: z.union([linkSchema, z.null()]) }),
  facebook: channelBase.extend({ url: z.union([linkSchema, z.null()]) }),
  twitter: channelBase.extend({ url: z.union([linkSchema, z.null()]) }),
});

/* ── Section registry ──────────────────────────────────────────────────────── */

export const SITE_SECTIONS = [
  'HERO',
  'ABOUT',
  'CULTURE',
  'SCRIPTURE',
  'SERVICE',
  'SERMONS',
  'COMMUNITY',
  'GIVING',
  'CONTACT',
] as const;

export const SiteSection = z.enum(SITE_SECTIONS);
export type SiteSectionName = z.infer<typeof SiteSection>;

/** Look up the validator for a given section name. */
export const SECTION_SCHEMAS = {
  HERO: HeroContentSchema,
  ABOUT: AboutContentSchema,
  CULTURE: CultureContentSchema,
  SCRIPTURE: ScriptureContentSchema,
  SERVICE: ServiceContentSchema,
  SERMONS: SermonsContentSchema,
  COMMUNITY: CommunityContentSchema,
  GIVING: GivingContentSchema,
  CONTACT: ContactContentSchema,
} as const satisfies Record<SiteSectionName, z.ZodTypeAny>;

export type SectionContent<S extends SiteSectionName> = z.infer<
  (typeof SECTION_SCHEMAS)[S]
>;

/** Convenience union for "any section's content". */
export type AnySectionContent =
  | { section: 'HERO'; content: SectionContent<'HERO'> }
  | { section: 'ABOUT'; content: SectionContent<'ABOUT'> }
  | { section: 'CULTURE'; content: SectionContent<'CULTURE'> }
  | { section: 'SCRIPTURE'; content: SectionContent<'SCRIPTURE'> }
  | { section: 'SERVICE'; content: SectionContent<'SERVICE'> }
  | { section: 'SERMONS'; content: SectionContent<'SERMONS'> }
  | { section: 'COMMUNITY'; content: SectionContent<'COMMUNITY'> }
  | { section: 'GIVING'; content: SectionContent<'GIVING'> }
  | { section: 'CONTACT'; content: SectionContent<'CONTACT'> };
