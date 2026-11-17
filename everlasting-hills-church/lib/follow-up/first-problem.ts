import type { z } from "zod";

/** The first problem with a value under a form's schema, worded for the person filling it; null when it is fine. */
export function firstProblem(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Check the form");
}
