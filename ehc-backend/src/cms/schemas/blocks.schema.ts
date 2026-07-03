import { z } from 'zod';

/**
 * Portable content model for CMS pages.
 *
 * Rich content is stored as a constrained block array (a simplified Tiptap JSON
 * schema — documented choice). No arbitrary HTML, no inline styles: every block
 * maps 1:1 to a public-site design-system component, and the shape is portable to
 * any renderer (web today, mobile later). Media is referenced by MediaAsset id or
 * raw R2 key — never a baked public URL (resolved at read time).
 */

const id = z.string().min(1);

export const HeadingBlock = z.object({
  id,
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().max(300),
});

export const ParagraphBlock = z.object({
  id,
  type: z.literal('paragraph'),
  text: z.string().max(10_000),
});

export const ImageBlock = z.object({
  id,
  type: z.literal('image'),
  mediaId: z.string().nullable().optional(),
  r2Key: z.string().nullable().optional(),
  /** Denormalized public URL (derived from r2Key at pick time) for simple rendering. */
  url: z.string().max(2000).nullable().optional(),
  alt: z.string().max(300),
  caption: z.string().max(500).optional(),
});

export const QuoteBlock = z.object({
  id,
  type: z.literal('quote'),
  text: z.string().max(2_000),
  cite: z.string().max(200).optional(),
});

export const ListBlock = z.object({
  id,
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(z.string().max(1_000)).max(100),
});

export const DividerBlock = z.object({ id, type: z.literal('divider') });

export const VideoBlock = z.object({
  id,
  type: z.literal('video'),
  url: z.string().url().max(500),
});

export const CtaBlock = z.object({
  id,
  type: z.literal('cta'),
  label: z.string().max(120),
  href: z.string().max(500),
});

// Entity-reference blocks — resolved against other modules at read time.
export const FeaturedSermonBlock = z.object({
  id,
  type: z.literal('featuredSermon'),
  sermonId: z.string().nullable(),
});

export const FeaturedEventBlock = z.object({
  id,
  type: z.literal('featuredEvent'),
  eventId: z.string().nullable(),
});

export const Block = z.discriminatedUnion('type', [
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  QuoteBlock,
  ListBlock,
  DividerBlock,
  VideoBlock,
  CtaBlock,
  FeaturedSermonBlock,
  FeaturedEventBlock,
]);

export const PageContent = z.object({
  blocks: z.array(Block).max(500),
});

export type Block = z.infer<typeof Block>;
export type PageContent = z.infer<typeof PageContent>;

export const EMPTY_CONTENT: PageContent = { blocks: [] };
