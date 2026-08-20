import { z } from 'zod';
import { isSupportedRecurrenceRule } from '../calendar/services/recurrence.util';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM');

/**
 * Accepts the RRULE subset the rest of the system can actually evaluate.
 *
 * Deliberately narrow, and deliberately checked with the same predicate the
 * dispatcher and the gatherings view use. Allowing an arbitrary RRULE here
 * would let an admin save a monthly rule that renders correctly in the calendar
 * feed but never fires a notification, which is worse than refusing it.
 */
const recurrenceRule = z
  .string()
  .min(1)
  .max(200)
  .refine(isSupportedRecurrenceRule, {
    message: 'Supported rules are FREQ=DAILY or FREQ=WEEKLY with an optional BYDAY',
  });

const timezone = z
  .string()
  .min(1)
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Unknown timezone');

/**
 * The field shape, without defaults.
 *
 * Defaults are applied on create only, below. They cannot live here because
 * `.partial()` does not strip a `.default()` — it wraps it — so a PATCH built
 * from a defaulted shape would resolve every omitted field to its default and
 * silently reset the gathering's duration, timezone and active flag on any
 * edit.
 */
const gatheringFields = {
  title: z.string().min(3).max(140),
  description: z.string().max(2000).nullable().optional(),
  recurrenceRule,
  /** Anchor date for the recurrence, YYYY-MM-DD. */
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  /** Local wall-clock start, read in `timezone`. */
  startTime: hhmm,
  durationMinutes: z.number().int().min(1).max(1440),
  timezone,
  joinUrl: z.url().max(500).nullable().optional(),
  isActive: z.boolean(),
};

export const createGatheringSchema = z.object({
  ...gatheringFields,
  durationMinutes: gatheringFields.durationMinutes.default(60),
  timezone: gatheringFields.timezone.default('Africa/Lagos'),
  isActive: gatheringFields.isActive.default(true),
});
export type CreateGatheringInput = z.infer<typeof createGatheringSchema>;

/**
 * Every field optional, but not an empty body: a PATCH that changes nothing is
 * a client bug, and answering it with 200 hides that.
 */
export const updateGatheringSchema = z
  .object(gatheringFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, { message: 'No fields to update' });
export type UpdateGatheringInput = z.infer<typeof updateGatheringSchema>;
