import { z } from "zod";

/**
 * The routing-rule form. The API runs the same rules
 * (ehc-backend/src/follow-up/routing/routing-rules.schema.ts); keep the two in
 * step. The edit schema has no defaults, so changing one field never resets another.
 */
export const SEGMENTS = {
  STUDENT: { label: "Students", hint: "First-timers who say on the form that they are students" },
  NOT_STUDENT: { label: "Everyone else", hint: "First-timers who are not students, or did not say" },
} as const;

export type Segment = keyof typeof SEGMENTS;

const name = z.string().trim().min(1, "Give the rule a name").max(80, "Keep the name under 80 characters");
const memberIds = z.array(z.string().trim().min(1)).max(50, "A pool can hold up to 50 people");

export const createRoutingRuleSchema = z.object({
  name,
  segment: z.enum(["STUDENT", "NOT_STUDENT"]),
  unitId: z.string().trim().min(1, "Pick the unit"),
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
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to change");

export type CreateRoutingRuleInput = z.infer<typeof createRoutingRuleSchema>;
export type UpdateRoutingRuleInput = z.infer<typeof updateRoutingRuleSchema>;
