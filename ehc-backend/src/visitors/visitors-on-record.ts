import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Every first timer the church still has a record of: those with no account
 * yet, and those whose account was made from their first-timer form and still
 * exists. A form whose account was later deleted no longer counts; neither does
 * an account that never came through the form (the Super Admin login, say).
 *
 * The admin First Timers page, the admin dashboard's onsite/online split and
 * the Follow Up page all count from this, so their totals agree.
 */
export async function visitorsOnRecord(prisma: PrismaService, tenantId: string): Promise<Prisma.VisitorWhereInput> {
  const converted = await prisma.visitor.findMany({
    where: { tenantId, convertedAt: { not: null }, convertedToMemberId: { not: null } },
    select: { convertedToMemberId: true },
  });
  const ids = [...new Set(converted.map((v) => v.convertedToMemberId as string))];
  const existing = ids.length
    ? await prisma.member.findMany({ where: { tenantId, id: { in: ids } }, select: { id: true } })
    : [];
  return { tenantId, OR: [{ convertedAt: null }, { convertedToMemberId: { in: existing.map((m) => m.id) } }] };
}

export async function countVisitorsOnRecord(prisma: PrismaService, tenantId: string): Promise<number> {
  return prisma.visitor.count({ where: await visitorsOnRecord(prisma, tenantId) });
}
