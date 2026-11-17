import { Prisma } from '@prisma/client';
import { safeFirstName } from '../events/follow-up-events';

/** A first-timer's first name, lock-screen safe, for the events an approval raises. */
export async function visitorFirstName(tx: Prisma.TransactionClient, tenantId: string, visitorId: string): Promise<string> {
  const visitor = await tx.visitor.findFirst({ where: { id: visitorId, tenantId }, select: { firstName: true } });
  return safeFirstName(visitor?.firstName);
}
