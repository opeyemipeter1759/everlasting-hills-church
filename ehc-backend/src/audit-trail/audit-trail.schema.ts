import { z } from 'zod';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-18');
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

/** The audit trail's filters. Dates are Lagos days, both ends included. */
export const auditTrailQuerySchema = z.object({
  search: optionalText(120),
  area: optionalText(80),
  actor: optionalText(80),
  from: day.optional(),
  to: day.optional(),
  cursor: optionalText(120),
  take: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditTrailQuery = z.infer<typeof auditTrailQuerySchema>;
