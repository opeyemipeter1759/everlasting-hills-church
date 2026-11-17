import { z } from 'zod';

/** "Friend or family" needs the inviter's name; "Other" needs a few words on how. */
export const FRIEND_OR_FAMILY = 'Friend/Family';
export const HEARD_OTHER = 'Other';

/**
 * How someone heard about the church, as the first-timer form and staff edits
 * both check it. The frontend runs the same rules (lib/first-timer/form-schema.ts);
 * keep the two in step. Only a value that is being set is checked, so a legacy
 * row without one still loads and saves, and an edit to another field never
 * touches these.
 */
export const heardFromSchema = z
  .object({
    howDidYouLearn: z.string().trim().max(200).optional().nullable(),
    invitedBy: z.string().trim().max(120).optional().nullable(),
    heardFromOther: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.howDidYouLearn === FRIEND_OR_FAMILY && !v.invitedBy) {
      ctx.addIssue({ code: 'custom', path: ['invitedBy'], message: 'Tell us who invited you' });
    }
    if (v.howDidYouLearn === HEARD_OTHER && !v.heardFromOther) {
      ctx.addIssue({ code: 'custom', path: ['heardFromOther'], message: 'Tell us how you heard about us' });
    }
  });

/** The problems with a heard-from answer, worded for the person filling the form; empty when it is fine. */
export function heardFromProblems(v: z.input<typeof heardFromSchema>): string[] {
  const result = heardFromSchema.safeParse(v);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}
