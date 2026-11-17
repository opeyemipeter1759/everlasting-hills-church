import { z } from 'zod';

/**
 * The bodies of the visit forms. The frontend checks the same rules
 * (everlasting-hills-church/lib/first-timer/visit-day.ts); keep the two in
 * step. Whether the day is real and not in the future is checked by
 * parseVisitDay, against the Lagos clock.
 */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date written like 2026-01-04');

/** "Came again": leave the date out for the latest service held. */
export const cameAgainSchema = z.object({ date: day.optional() }).strict();

/** A staff correction of the first visit date. */
export const firstVisitSchema = z.object({ date: day }).strict();
