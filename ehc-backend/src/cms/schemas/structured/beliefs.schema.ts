import { z } from 'zod';

/**
 * Structured content for the /beliefs page. The design is fixed (five pillar
 * cards with positional icons + numbers); only the copy is editable. Mirrors the
 * "structure doesn't change, content does" rule used by the homepage sections.
 */

const PillarSchema = z.object({
  title: z.string().trim().min(1).max(80),
  verse: z.string().trim().min(1).max(60),
  text: z.string().trim().min(1).max(1000),
});

export const BeliefsSchema = z.object({
  eyebrow: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(80),
  accent: z.string().trim().min(1).max(80),
  lead: z.string().trim().min(1).max(400),
  pillars: z.tuple([PillarSchema, PillarSchema, PillarSchema, PillarSchema, PillarSchema]),
  cta: z.object({
    heading: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(400),
  }),
});

export type BeliefsContent = z.infer<typeof BeliefsSchema>;

/** Seeded from the current static /beliefs page so the editor opens pre-filled. */
export const DEFAULT_BELIEFS: BeliefsContent = {
  eyebrow: 'What We Believe',
  title: 'Five pillars from',
  accent: 'Genesis 49:22-26',
  lead: 'The blessing spoken over Joseph still shapes a people who give themselves fully to God. These five pillars frame everything we are.',
  pillars: [
    {
      title: 'Fruitfulness',
      verse: 'Genesis 49:22',
      text: 'Joseph is a fruitful bough by a well. We believe every life joined to Christ, the well that never runs dry, is meant to be fruitful, with branches that run over the wall into every sphere of society.',
    },
    {
      title: 'Endurance',
      verse: 'Genesis 49:23-24',
      text: 'Though the archers shot at him, his bow abode in strength. We believe in standing firm under pressure, holding our confession through trials, anchored by a faith that does not bend.',
    },
    {
      title: 'Divine Strength',
      verse: 'Genesis 49:24',
      text: 'His strength came from the mighty God of Jacob, the Shepherd, the Stone of Israel. We believe our sufficiency is not in ourselves but in the God who upholds and shepherds His people.',
    },
    {
      title: 'Abundant Blessing',
      verse: 'Genesis 49:25',
      text: 'Blessings of heaven above, of the deep beneath, and of every kind. We believe in the generous God who blesses His children fully, so that they in turn become a blessing to many.',
    },
    {
      title: 'The Everlasting Hills',
      verse: 'Genesis 49:26',
      text: "His blessings prevail unto the utmost bound of the everlasting hills. We believe we are called to a lasting, generational inheritance, crowned and set apart for God's enduring purpose.",
    },
  ],
  cta: {
    heading: 'Come and see for yourself',
    body: 'These are not just words on a page. Join us on a Sunday and experience them in a living family.',
  },
};
