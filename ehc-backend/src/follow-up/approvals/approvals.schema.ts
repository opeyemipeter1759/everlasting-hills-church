import { z } from 'zod';

/**
 * The approval forms, as the API checks them. The frontend runs the same rules
 * (everlasting-hills-church/lib/follow-up/approval-schema.ts); keep the two in step.
 */
const note = z.string().trim().max(1000, 'Keep the note under 1,000 characters');

export const requestApprovalSchema = z.object({
  visitorId: z.string().trim().min(1, 'Pick a first-timer'),
  note: note.optional().nullable(),
});

export const decideApprovalSchema = z
  .object({
    decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
    note: note.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.decision === 'CHANGES_REQUESTED' && !v.note) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Say what still needs to happen' });
    }
  });

export type RequestApprovalInput = z.infer<typeof requestApprovalSchema>;
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
