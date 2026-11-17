import { z } from "zod";
import { FRIEND_OR_FAMILY, HEARD_OTHER } from "./fields";

/**
 * How someone heard about the church. The API runs the same rules
 * (ehc-backend/src/forms/first-timer-heard-from.schema.ts); keep the two in
 * step. Only a value being set is checked, so legacy rows without one still
 * load and save.
 */
export const heardFromSchema = z
  .object({
    howDidYouLearn: z.string().trim().max(200).optional().nullable(),
    invitedBy: z.string().trim().max(120).optional().nullable(),
    heardFromOther: z.string().trim().max(200).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.howDidYouLearn === FRIEND_OR_FAMILY && !v.invitedBy) {
      ctx.addIssue({ code: "custom", path: ["invitedBy"], message: "Tell us who invited you" });
    }
    if (v.howDidYouLearn === HEARD_OTHER && !v.heardFromOther) {
      ctx.addIssue({ code: "custom", path: ["heardFromOther"], message: "Tell us how you heard about us" });
    }
  });

/** Field name to message, for a form to show beside each field. */
export function heardFromErrors(v: z.input<typeof heardFromSchema>): Record<string, string> {
  const result = heardFromSchema.safeParse(v);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
}
