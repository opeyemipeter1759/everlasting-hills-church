import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthUser } from '../auth/types/auth-user';

type Db = Pick<Prisma.TransactionClient, 'auditLog'>;

export type CounsellingEntity =
  | 'CounsellingApplication'
  | 'CounsellingSession'
  | 'CounsellingModule'
  | 'CounsellingSettings'
  | 'CounsellingDocument'
  | 'CounsellingDocumentTemplate'
  | 'CounsellingParticipant'
  | 'WeddingApproval';

/**
 * A counselling audit event: who, what, which record, when. Never field values:
 * `before` and `after` are always empty. Rows for these entities cannot be
 * changed or deleted (a database trigger refuses).
 */
export async function counsellingAudit(
  db: Db,
  e: {
    tenantId: string;
    actor: AuthUser | null;
    action: string;
    entity: CounsellingEntity;
    entityId: string;
  },
): Promise<void> {
  await db.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId: e.tenantId,
      actorId: e.actor?.userId ?? null,
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      before: Prisma.DbNull,
      after: Prisma.DbNull,
    },
  });
}
