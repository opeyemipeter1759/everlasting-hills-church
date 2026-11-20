import { BadRequestException, ConflictException } from '@nestjs/common';
import { CounsellingStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * The only place a counselling case changes status. Every allowed move is
 * listed here; anything else is refused. CLOSED is reachable from any status
 * that is not finished. Completing never creates a wedding approval.
 */
export const ALLOWED: Record<CounsellingStatus, readonly CounsellingStatus[]> =
  {
    SUBMITTED: ['UNDER_REVIEW', 'CLOSED'],
    UNDER_REVIEW: [
      'ADDITIONAL_INFORMATION_REQUIRED',
      'ACCEPTED_FOR_COUNSELLING',
      'CLOSED',
    ],
    ADDITIONAL_INFORMATION_REQUIRED: ['UNDER_REVIEW', 'CLOSED'],
    ACCEPTED_FOR_COUNSELLING: ['IN_COUNSELLING', 'CLOSED'],
    IN_COUNSELLING: ['FINAL_REVIEW', 'CLOSED'],
    FINAL_REVIEW: ['COMPLETED', 'IN_COUNSELLING', 'CLOSED'],
    COMPLETED: [],
    CLOSED: [],
  };

export const STATUS_LABEL: Record<CounsellingStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ADDITIONAL_INFORMATION_REQUIRED: 'Waiting for more information',
  ACCEPTED_FOR_COUNSELLING: 'Accepted for counselling',
  IN_COUNSELLING: 'In counselling',
  FINAL_REVIEW: 'Final review',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};

export const isFinished = (s: CounsellingStatus) =>
  s === 'COMPLETED' || s === 'CLOSED';

export function canTransition(
  from: CounsellingStatus,
  to: CounsellingStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

/**
 * Moves the case and writes the status event, inside the caller's transaction.
 * The update only applies if the case is still in `from`, so two people acting
 * at once can never both move it.
 */
export async function moveStatus(
  tx: Prisma.TransactionClient,
  m: {
    tenantId: string;
    applicationId: string;
    from: CounsellingStatus;
    to: CounsellingStatus;
    actorProfileId: string | null;
    reason?: string | null;
  },
): Promise<void> {
  if (!canTransition(m.from, m.to)) {
    throw new BadRequestException(
      `A case that is ${STATUS_LABEL[m.from].toLowerCase()} cannot move to ${STATUS_LABEL[m.to].toLowerCase()}`,
    );
  }
  const { count } = await tx.counsellingApplication.updateMany({
    where: { id: m.applicationId, tenantId: m.tenantId, status: m.from },
    data: { status: m.to },
  });
  if (count === 0)
    throw new ConflictException(
      'Someone else changed this case just now. Reload and try again.',
    );
  await tx.counsellingStatusEvent.create({
    data: {
      id: randomUUID(),
      tenantId: m.tenantId,
      applicationId: m.applicationId,
      fromStatus: m.from,
      toStatus: m.to,
      actorProfileId: m.actorProfileId,
      reason: m.reason || null,
    },
  });
}
