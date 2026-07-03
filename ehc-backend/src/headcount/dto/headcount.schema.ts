import { z } from 'zod';

/**
 * Usher headcount input. All category counts are non-negative integers. `total`
 * is NOT accepted from the client — the service computes it as men+women+boys+girls.
 * `firstTimers` is an overlapping subset of those present, so it is validated
 * against the computed total in the service (a first-timer is also a man/woman/
 * boy/girl and is never added into the total).
 */
const count = z.number().int().min(0).max(1_000_000);

export const UpsertHeadcountSchema = z.object({
  men: count.default(0),
  women: count.default(0),
  boys: count.default(0),
  girls: count.default(0),
  firstTimers: count.default(0),
  reportedTotal: count.nullish(),
  notes: z.string().trim().max(1000).nullish(),
  /** When true, the record is CONFIRMED; otherwise it stays a DRAFT. */
  confirm: z.boolean().optional(),
});

export type UpsertHeadcountInput = z.infer<typeof UpsertHeadcountSchema>;
