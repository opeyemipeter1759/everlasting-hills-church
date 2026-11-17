import { z } from "zod";

/**
 * The visit forms ("Came again" and the first visit date). The API runs the
 * same rules (ehc-backend/src/follow-up/visits/visit-day.schema.ts); keep the
 * two in step. Days are church-local (Africa/Lagos) and never in the future.
 */
export const visitDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
  .refine((d) => d <= lagosToday(), "A visit can't be in the future");

/** Today's date in Lagos, "YYYY-MM-DD". Lagos is UTC+1 all year. */
export function lagosToday(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The message to show beside the date field, or null when the day is fine. */
export function visitDayError(day: string): string | null {
  const result = visitDaySchema.safeParse(day);
  return result.success ? null : result.error.issues[0].message;
}
