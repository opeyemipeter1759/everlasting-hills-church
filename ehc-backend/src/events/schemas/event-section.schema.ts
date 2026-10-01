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

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date');
const weekday = z.number().int().min(0).max(6); // 0 = Sunday

/**
 * A fast set out by its rules — dates, the one-meal time, the dry-fast
 * stretches and when prayer meets — so the day-by-day calendar is worked out
 * on the page rather than typed in for every day.
 */
const fastingSchedule = z
  .object({
    introduction: optionalText(1200),
    startDate: isoDate,
    endDate: isoDate,
    /** When the one meal is taken on ordinary days, e.g. "3pm". */
    mealTime: text(20),
    dryFasts: z
      .array(z.object({ startDate: isoDate, endDate: isoDate, breakTime: text(40) }))
      .max(12)
      .default([]),
    /** Shown under the dry-fast weekends, e.g. why the last weekend isn't dry. */
    note: optionalText(400),
    morningTime: optionalText(20),
    eveningTime: optionalText(20),
    /** Weekdays with no morning / evening prayer session. */
    noMorningDays: z.array(weekday).max(7).default([]),
    noEveningDays: z.array(weekday).max(7).default([]),
    /** Shown in place of the morning session on these days, e.g. "Sunday service" on Sundays. */
    serviceDays: z.array(weekday).max(7).default([]),
    sessionsNote: optionalText(300),
    guidelines: z
      .array(z.object({ title: text(80), body: text(600) }))
      .max(8)
      .default([]),
    scriptureText: optionalText(600),
    scriptureReference: optionalText(80),
  })
  .refine((c) => c.startDate <= c.endDate, { message: 'The fast must end on or after the day it starts', path: ['endDate'] })
  .refine((c) => c.dryFasts.every((d) => d.startDate <= d.endDate && d.startDate >= c.startDate && d.endDate <= c.endDate), {
    message: 'Each dry fast must fall within the fast and end on or after it starts',
    path: ['dryFasts'],
  });

export const eventSectionInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('FASTING_SCHEDULE'),
    content: fastingSchedule,
  }),
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

