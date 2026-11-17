import { ApprovalStatus, Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Cancels whatever approval is still pending for a subject, inside the
 * caller's transaction. Reassigning a first-timer calls this: the request was
 * about someone else's follow-up, so it no longer stands.
 */
export async function cancelPendingApprovals(
  tx: Tx,
  input: { tenantId: string; subjectType: string; subjectId: string; actorId?: string | null; note: string },
): Promise<number> {
  const { count } = await tx.approvalRequest.updateMany({
    where: { tenantId: input.tenantId, subjectType: input.subjectType, subjectId: input.subjectId, status: ApprovalStatus.PENDING },
    data: {
      status: ApprovalStatus.CANCELLED,
      deciderId: input.actorId ?? null,
      decidedAt: new Date(),
      decisionNote: input.note,
    },
  });
  return count;
}
