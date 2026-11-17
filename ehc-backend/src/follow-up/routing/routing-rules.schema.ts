import { z } from 'zod';
import { SEGMENT_KEYS } from './routing';

/**
 * The routing-rule form, as the API checks it. The frontend runs the same
 * rules (everlasting-hills-church/lib/follow-up/routing-schema.ts); keep the
 * two in step. The edit schema is its own object with no defaults, so a change
 * to one field never resets another.
 */
const name = z.string().trim().min(1, 'Give the rule a name').max(80, 'Keep the name under 80 characters');
const memberIds = z.array(z.string().trim().min(1)).max(50, 'A pool can hold up to 50 people');

export const createRoutingRuleSchema = z.object({
  name,
  segment: z.enum(SEGMENT_KEYS),
  unitId: z.string().trim().min(1, 'Pick the unit'),
  memberIds,
  priority: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export const updateRoutingRuleSchema = z
  .object({
    name: name.optional(),
    unitId: z.string().trim().min(1).optional(),
    memberIds: memberIds.optional(),
    priority: z.number().int().min(0).max(100).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'Nothing to change');

export type CreateRoutingRuleInput = z.infer<typeof createRoutingRuleSchema>;
export type UpdateRoutingRuleInput = z.infer<typeof updateRoutingRuleSchema>;
