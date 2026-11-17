import { z } from 'zod';

/**
 * The approval forms, as the API checks them. The frontend runs the same rules
 * (everlasting-hills-church/lib/follow-up/approval-schema.ts); keep the two in
 * step. Whether asking for changes needs a note depends on the kind, so the
 * service checks that.
 */
const note = z.string().trim().max(1000, 'Keep the note under 1,000 characters');

export const requestApprovalSchema = z.object({
  visitorId: z.string().trim().min(1, 'Pick a first-timer'),
  note: note.optional().nullable(),
});

export const decideApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
  note: note.optional().nullable(),
  /** For an assignment: give them to this member instead of the person proposed. */
  assigneeId: z.string().trim().min(1).optional().nullable(),
});

export type RequestApprovalInput = z.infer<typeof requestApprovalSchema>;
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
