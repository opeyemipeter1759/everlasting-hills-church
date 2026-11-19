import { z } from 'zod';

/**
 * The pre-marital counselling application, as the API checks it. The public
 * form runs the same rules (everlasting-hills-church/lib/pre-marital/schema.ts);
 * keep the two in step.
 *
 * Only what the pastoral team needs to review the application and reach the
 * couple is asked: names, how to contact each of them, whether each is a member,
 * and, if they have them, the wedding date, how long they have known each other
 * and a short note. Nothing more sensitive (dates of birth, addresses, past
 * marriages) is collected; the pastors ask in person.
 */

export const RELATIONSHIP_LENGTHS = [
  'UNDER_6_MONTHS',
  '6_TO_12_MONTHS',
  '1_TO_2_YEARS',
  'OVER_2_YEARS',
] as const;
export const APPLICATION_STATUSES = ['NEW', 'IN_REVIEW', 'CLOSED'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const PHONE = /^[\d\s\-+()]+$/;

const name = (what: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${what}`)
    .max(60, 'Keep the name under 60 characters');
const phone = (whose: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${whose} phone number`)
    .max(30, 'That phone number is too long')
    .regex(PHONE, 'Use digits, spaces, + or brackets only')
    .refine(
      (v) => v.replace(/\D/g, '').length >= 7,
      'That phone number is too short',
    );
const email = (whose: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, `Enter the ${whose} email address`)
    .max(254, 'That email address is too long')
    .email('Enter a valid email address');
const member = (who: string) =>
  z.boolean({
    error: `Say whether the ${who} is a member of Everlasting Hills`,
  });

/** Today in Lagos, YYYY-MM-DD, for "the wedding date cannot be in the past". */
export function lagosToday(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const applicationSchema = z.object({
  /** Made by the form when it opens; the same key again returns the same application. */
  submissionKey: z.string().uuid('Reload the page and try again'),
  groomFirstName: name("groom's first name"),
  groomLastName: name("groom's last name"),
  groomPhone: phone("groom's"),
  groomEmail: email("groom's"),
  groomIsMember: member('groom'),
  brideFirstName: name("bride's first name"),
  brideLastName: name("bride's last name"),
  bridePhone: phone("bride's"),
  brideEmail: email("bride's"),
  brideIsMember: member('bride'),
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), 'Pick a date')
    .refine((d) => d >= lagosToday(), 'The wedding date cannot be in the past')
    .nullish(),
  relationshipLength: z
    .enum(RELATIONSHIP_LENGTHS, { error: 'Pick one of the options' })
    .nullish(),
  message: z
    .string()
    .trim()
    .max(1000, 'Keep this under 1,000 characters')
    .nullish(),
  consent: z.literal(true, { error: 'Both of you need to agree to apply' }),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, {
    error: 'Pick New, In review or Closed',
  }),
});

export const listQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
});
