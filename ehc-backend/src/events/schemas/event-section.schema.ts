import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalLink = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
    'Must be an http(s) URL or a relative path beginning with /',
  )
  .optional();

const expectationItem = z.object({
  title: text(120),
  description: text(800),
  scripture: optionalText(200),
  icon: optionalText(40),
});

const prayerFocus = z.object({
  title: text(160),
  introduction: optionalText(1000),
  dayDate: optionalText(80),
  declaration: optionalText(1000),
  scriptures: z.array(text(300)).max(12).default([]),
  prayerPoints: z.array(text(600)).max(20).default([]),
});

export const eventSectionInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('RICH_TEXT'),
    content: z.object({ body: text(20_000) }),
  }),
  z.object({
    type: z.literal('SCHEDULE'),
    content: z.object({
      introduction: optionalText(1200),
      tags: z.array(text(60)).max(12).default([]),
    }),
  }),
  z.object({
    type: z.literal('EXPECTATIONS'),
    content: z.object({
      introduction: optionalText(1200),
      items: z.array(expectationItem).min(1).max(12),
    }),
  }),
  z.object({
    type: z.literal('PRAYER_FOCUS'),
    content: z.object({ focuses: z.array(prayerFocus).max(31) }),
  }),
  z.object({
    type: z.literal('FAQ'),
    content: z.object({
      items: z
        .array(z.object({ question: text(240), answer: text(2000) }))
        .min(1)
        .max(30),
    }),
  }),
  z.object({
    type: z.literal('TESTIMONY'),
    content: z.object({
      body: text(2000),
      buttonLabel: text(60),
      url: optionalLink,
    }),
  }),
  z.object({
    type: z.literal('RESPONSE'),
    content: z.object({
      introduction: optionalText(600),
      // Each card is a distinct way to respond. Consent lines are shown on the
      // card so somebody knows what they are agreeing to before they open the
      // form, not only once they are inside it.
      actions: z
        .array(
          z.object({
            heading: text(120),
            body: optionalText(600),
            buttonLabel: text(60),
            url: optionalLink,
            note: optionalText(300),
          }),
        )
        .min(1)
        .max(4),
    }),
  }),
  z.object({
    type: z.literal('CTA'),
    content: z.object({
      body: optionalText(2000),
      buttonLabel: text(60),
      url: optionalLink,
    }),
  }),
]);

export type ValidatedEventSection = z.infer<typeof eventSectionInputSchema>;

