import { z } from 'zod';

/** "HH:MM" 24-hour, matching the DB CHECK constraint. */
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');

/**
 * A PushSubscription as the browser's PushManager produces it. Field names are
 * fixed by the Push API, so they are taken as-is rather than renamed.
 */
export const subscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(400).optional(),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const unsubscribeSchema = z.object({
  endpoint: z.url(),
});
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;

/**
 * Preference update. Every field optional so the UI can PATCH a single toggle.
 *
 * quietStart and quietEnd are nullable rather than merely optional: clearing
 * quiet hours has to be expressible, and omitting them has to mean "leave
 * unchanged". Those are different intents and collapsing them would make the
 * window impossible to turn off.
 */
export const updatePreferencesSchema = z
  .object({
    // Written out rather than generated from PUSH_CATEGORIES: building the shape
    // with Object.fromEntries erases the literal keys, so the inferred type
    // loses every category and callers cannot read input.newSermon.
    serviceStarting: z.boolean().optional(),
    serviceReminder: z.boolean().optional(),
    servingReminder: z.boolean().optional(),
    prayerMeeting: z.boolean().optional(),
    announcements: z.boolean().optional(),
    unitAnnouncements: z.boolean().optional(),
    newSermon: z.boolean().optional(),
    milestones: z.boolean().optional(),
    quietStart: hhmm.nullable().optional(),
    quietEnd: hhmm.nullable().optional(),
    timezone: z.string().min(1).max(64).optional(),
  })
  .refine(
    (v) =>
      // Both or neither. One bound alone describes no window and would leave
      // the dispatcher unable to decide anything.
      !(v.quietStart === null && typeof v.quietEnd === 'string') &&
      !(v.quietEnd === null && typeof v.quietStart === 'string'),
    { message: 'Set both quiet hour bounds, or clear both' },
  )
  .refine(
    (v) => {
      if (!v.timezone) return true;
      // Reject a timezone the dispatcher could not later resolve; an unknown
      // zone would silently disable quiet hours instead of erroring here.
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: v.timezone });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Unknown timezone' },
  );
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
