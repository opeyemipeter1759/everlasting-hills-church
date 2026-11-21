import { z } from 'zod';
import { lagosToday } from './lagos-time';

/**
 * Pre-marital counselling input, as the API checks it. The public form runs the
 * same rules (everlasting-hills-church/lib/pre-marital/schema.ts); keep them in
 * step. PATCH shapes have no defaults, so a field that is left out is never reset.
 */

export const STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ADDITIONAL_INFORMATION_REQUIRED',
  'ACCEPTED_FOR_COUNSELLING',
  'IN_COUNSELLING',
  'FINAL_REVIEW',
  'COMPLETED',
  'CLOSED',
] as const;
export const MEMBERSHIP = ['BOTH_MEMBERS', 'ONE_MEMBER', 'NEITHER'] as const;
export const CONTACT_METHODS = ['WHATSAPP', 'PHONE_CALL', 'EMAIL'] as const;
export const ATTENDANCE = [
  'UNMARKED',
  'BOTH_PRESENT',
  'ONE_PRESENT',
  'ABSENT',
] as const;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const blankToNull = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? null : v;

const name = (what: string) =>
  z
    .string({ error: `Enter ${what}` })
    .trim()
    .min(1, `Enter ${what}`)
    .max(60, 'Keep the name under 60 characters');
const phone = (whose: string) =>
  z
    .string({ error: `Enter ${whose} phone number` })
    .trim()
    .min(1, `Enter ${whose} phone number`)
    .max(30, 'That phone number is too long')
    .regex(/^[\d\s\-+()]+$/, 'Use digits, spaces, + or brackets only')
    .refine(
      (v) => v.replace(/\D/g, '').length >= 7,
      'That phone number is too short',
    );
const email = (whose: string) =>
  z
    .string({ error: `Enter ${whose} email address` })
    .trim()
    .toLowerCase()
    .min(1, `Enter ${whose} email address`)
    .max(254, 'That email address is too long')
    .email('Enter a valid email address');
const day = (message: string) =>
  z
    .string()
    .regex(DAY, message)
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), message);

export const publicApplicationSchema = z
  .object({
    submissionKey: z.string().uuid('Reload the page and try again'),
    applicantRole: z.enum(['GROOM', 'BRIDE'], {
      error: 'Tell us whether you are the intending groom or the intending bride',
    }),
    /** Honeypot: hidden from people, filled in by bots. */
    website: z.string().max(500).optional(),
    applicantFirstName: name('your first name'),
    applicantLastName: name('your last name'),
    applicantEmail: email('your'),
    applicantPhone: phone('your'),
    partnerFirstName: name("your partner's first name"),
    partnerLastName: name("your partner's last name"),
    /** Required: each partner gets their own dashboard sign-in (email, with the phone number as the first password). */
    partnerEmail: email("your partner's"),
    partnerPhone: phone("your partner's"),
    partnerConsentToContact: z.literal(true, {
      error: 'Confirm your partner is happy for us to contact them',
    }),
    membership: z.enum(MEMBERSHIP, {
      error: 'Tell us whether you are members of Everlasting Hills',
    }),
    weddingDate: z.preprocess(
      blankToNull,
      day('Pick a date')
        .refine(
          (d) => d >= lagosToday(),
          'The wedding date cannot be in the past',
        )
        .nullish(),
    ),
    preferredContact: z.enum(CONTACT_METHODS, {
      error: 'Choose how we should contact you',
    }),
    intro: z.preprocess(
      blankToNull,
      z.string().trim().max(500, 'Keep this under 500 characters').nullish(),
    ),
    privacyAcknowledged: z.literal(true, {
      error: 'Please read and accept the privacy notice',
    }),
  })
  .superRefine((v, ctx) => {
    if (v.partnerEmail === v.applicantEmail) {
      ctx.addIssue({
        code: 'custom',
        path: ['partnerEmail'],
        message: "Use your partner's own email address. Each of you signs in separately.",
      });
    }
    if (v.partnerPhone.replace(/\D/g, '') === v.applicantPhone.replace(/\D/g, '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['partnerPhone'],
        message: "Use your partner's own phone number.",
      });
    }
  });
export type PublicApplicationInput = z.infer<typeof publicApplicationSchema>;

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  counsellor: z.string().min(1).max(64).optional(),
  from: day('Use a date like 2026-11-20').optional(),
  to: day('Use a date like 2026-11-20').optional(),
  cursor: z.string().min(1).max(64).optional(),
  take: z.coerce.number().int().min(1).max(100).default(25),
  /** "closed": closed or archived cases that still hold stored document files. */
  storedFiles: z.literal('closed').optional(),
});

export const transitionSchema = z.object({
  to: z.enum(STATUSES, { error: 'Pick a status' }),
  reason: z
    .string()
    .trim()
    .max(300, 'Keep the reason under 300 characters')
    .nullish(),
  /** A Pastor moving past the documents check, with one of the listed reasons. */
  override: z
    .object({ reason: z.string().trim().min(1, 'Pick a reason').max(60) })
    .nullish(),
});

export const requestInfoSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, 'Keep the reason under 300 characters')
    .nullish(),
});

/** Admin logistics. A key that is left out is left alone. */
export const adminPatchSchema = z.object({
  adminNote: z
    .string()
    .trim()
    .max(500, 'Keep the note under 500 characters')
    .nullable()
    .optional(),
  memberId: z.string().min(1).max(64).nullable().optional(),
});

export const assignSchema = z.object({
  counsellorProfileId: z.string().min(1, 'Pick a counsellor').max(64),
  isLead: z.boolean().optional(),
});

export const safeguardingSchema = z.object({ raised: z.boolean() });

export const weddingApprovalSchema = z.object({
  note: z
    .string()
    .trim()
    .max(300, 'Keep the note under 300 characters')
    .nullish(),
});

const sessionWhere = {
  format: z.enum(['PHYSICAL', 'ONLINE'], {
    error: 'Choose in person or online',
  }),
  location: z.preprocess(blankToNull, z.string().trim().max(200).nullish()),
  meetingLink: z.preprocess(
    blankToNull,
    z.string().trim().url('Paste the full meeting link').max(500).nullish(),
  ),
};

export const sessionCreateSchema = z
  .object({
    date: day('Pick a date'),
    time: z.string().regex(TIME, 'Pick a time'),
    durationMinutes: z.number().int().min(15).max(240).optional(),
    ...sessionWhere,
    counsellorProfileId: z.string().min(1).max(64).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.format === 'PHYSICAL' && !v.location)
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Say where you will meet',
      });
    if (v.format === 'ONLINE' && !v.meetingLink)
      ctx.addIssue({
        code: 'custom',
        path: ['meetingLink'],
        message: 'Add the meeting link',
      });
  });

/** Edits that keep the time. A key that is left out is left alone. */
export const sessionPatchSchema = z.object({
  durationMinutes: z.number().int().min(15).max(240).optional(),
  format: sessionWhere.format.optional(),
  location: sessionWhere.location.optional(),
  meetingLink: sessionWhere.meetingLink.optional(),
});

export const rescheduleSchema = z.object({
  date: day('Pick a date'),
  time: z.string().regex(TIME, 'Pick a time'),
});
export const attendanceSchema = z.object({
  attendance: z.enum(ATTENDANCE, { error: 'Pick who attended' }),
});
export const sessionsQuerySchema = z.object({
  from: day('Use a date like 2026-11-20').optional(),
  to: day('Use a date like 2026-11-20').optional(),
});


