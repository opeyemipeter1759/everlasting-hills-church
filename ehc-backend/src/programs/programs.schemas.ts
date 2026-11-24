import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 22:00');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2027-10-01');
const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);
const optionalText = (max: number) => text(max).nullable().transform((v) => (v === '' ? null : v));
/** https anywhere, or a path on this site ("/prayer-watch"). */
const link = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\/[^\s]+$/.test(v), 'Use a link starting with https:// or a page path starting with /')
  .nullable()
  .transform((v) => (v === '' ? null : v));
const httpsOnly = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/.test(v), 'Use a link starting with https://')
  .nullable()
  .transform((v) => (v === '' ? null : v));

/**
 * The rules the schedule presets produce. Anything else is refused, so a rule
 * an admin saves is one the site can always compute and describe in words.
 */
const RULES = [
  /^FREQ=WEEKLY;BYDAY=(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*$/,
  /^FREQ=MONTHLY;BYMONTHDAY=(-1|[1-9]|1\d|2[0-8])$/,
  /^FREQ=YEARLY;BYMONTH=([1-9]|1[0-2]);BYDAY=-1SA$/,
  /^FREQ=YEARLY;BYMONTH=([1-9]|1[0-2]);BYMONTHDAY=([1-9]|[12]\d|3[01])$/,
  /^FREQ=YEARLY;BYMONTH=([1-9]|1[0-2])$/,
];
export const isPresetRule = (rule: string) => RULES.some((r) => r.test(rule));
const rule = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isPresetRule, 'Pick a schedule from the presets')
  .nullable();

const ENUMS = {
  nameStatus: z.enum(['FINAL', 'PROVISIONAL']),
  programType: z.enum(['PRAYER', 'PROPHETIC', 'CONSECRATION', 'CONFERENCE', 'HOLY_GHOST', 'OTHER']),
  cadence: z.enum(['WEEKLY', 'MONTHLY', 'ANNUAL', 'CUSTOM']),
  dateStatus: z.enum(['CONFIRMED', 'TBA']),
  format: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  accent: z.enum(['BURGUNDY', 'CRIMSON', 'DEEP_BURGUNDY', 'GOLD']),
};

/**
 * The editable fields, with no defaults. Defaults are applied on create only:
 * `.partial()` keeps a `.default()`, so a PATCH built from a defaulted shape
 * would quietly reset every field it left out. That bug shipped once; the
 * update schema below is this shape made optional, and a test proves an
 * omitted field is left alone.
 */
const fields = {
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes').max(60),
  name: text(80).min(1, 'Give the program a name'),
  nameStatus: ENUMS.nameStatus,
  eyebrow: optionalText(80),
  shortDescription: text(280).min(1, 'Write a short description'),
  longDescription: z.string().max(20_000).nullable(),
  programType: ENUMS.programType,
  cadence: ENUMS.cadence,
  recurrenceRule: rule,
  startTime: hhmm.nullable(),
  durationMinutes: z.number().int().min(1).max(20_160).nullable(),
  startOffsetDays: z.number().int().min(-6).max(6),
  timezone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Unknown timezone'),
  dateStatus: ENUMS.dateStatus,
  format: ENUMS.format,
  venue: optionalText(200),
  streamUrl: httpsOnly,
  logoUrl: httpsOnly,
  coverUrl: httpsOnly,
  accent: ENUMS.accent,
  ctaLabel: optionalText(40),
  ctaUrl: link,
  featured: z.boolean(),
};

export const createProgramSchema = z
  .object({
    ...fields,
    slug: fields.slug.optional(),
    nameStatus: fields.nameStatus.default('FINAL'),
    eyebrow: fields.eyebrow.default(null),
    longDescription: fields.longDescription.default(null),
    programType: fields.programType.default('OTHER'),
    cadence: fields.cadence.default('CUSTOM'),
    recurrenceRule: fields.recurrenceRule.default(null),
    startTime: fields.startTime.default(null),
    durationMinutes: fields.durationMinutes.default(null),
    startOffsetDays: fields.startOffsetDays.default(0),
    timezone: fields.timezone.default('Africa/Lagos'),
    dateStatus: fields.dateStatus.default('TBA'),
    format: fields.format.default('IN_PERSON'),
    venue: fields.venue.default(null),
    streamUrl: fields.streamUrl.default(null),
    logoUrl: fields.logoUrl.default(null),
    coverUrl: fields.coverUrl.default(null),
    accent: fields.accent.default('BURGUNDY'),
    ctaLabel: fields.ctaLabel.default(null),
    ctaUrl: fields.ctaUrl.default(null),
    featured: fields.featured.default(false),
  })
  .strict();

export const updateProgramSchema = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])) as { [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]> })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to change');

export const reorderSchema = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(200) }).strict();

export const scripturesSchema = z
  .object({
    scriptures: z
      .array(z.object({ reference: z.string().trim().min(3).max(60), status: z.enum(['CONFIRMED', 'SUGGESTED']).default('CONFIRMED') }).strict())
      .max(10),
  })
  .strict();

export const sessionsSchema = z
  .object({
    sessions: z.array(z.object({ name: text(60).min(1), startTime: hhmm, endTime: hhmm, description: optionalText(300).default(null) }).strict()).max(12),
  })
  .strict();

export const editionsSchema = z
  .object({
    editions: z
      .array(
        z
          .object({
            label: text(60).min(1),
            theme: optionalText(80).default(null),
            startsOn: day.nullable().default(null),
            endsOn: day.nullable().default(null),
            dateStatus: ENUMS.dateStatus,
            summary: optionalText(600).default(null),
            recordingUrl: httpsOnly.default(null),
          })
          .strict()
          .refine((e) => e.dateStatus === 'TBA' || (e.startsOn && e.endsOn), 'A confirmed edition needs its start and end dates')
          .refine((e) => !e.startsOn || !e.endsOn || e.endsOn >= e.startsOn, 'The edition ends before it starts'),
      )
      .max(30),
  })
  .strict();

export const schedulePreviewSchema = z
  .object({
    cadence: ENUMS.cadence,
    programType: ENUMS.programType.default('OTHER'),
    recurrenceRule: rule.default(null),
    startTime: hhmm.nullable().default(null),
    durationMinutes: z.number().int().min(1).max(20_160).nullable().default(null),
    startOffsetDays: z.number().int().min(-6).max(6).default(0),
    timezone: z.string().default('Africa/Lagos'),
    dateStatus: ENUMS.dateStatus,
  })
  .strict();

export type CreateProgram = z.infer<typeof createProgramSchema>;
export type UpdateProgram = z.infer<typeof updateProgramSchema>;
