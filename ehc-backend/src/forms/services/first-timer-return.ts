import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Someone the church already has a record of with this phone or email: a
 * possible return visit. Families share phones, so this only flags the new
 * form for staff to confirm; nothing is ever merged automatically.
 */
export async function findPossibleReturn(
  prisma: PrismaService,
  tenantId: string,
  phone: string | null,
  email: string | null,
): Promise<{ visitorId: string | null; memberId: string | null }> {
  const last10 = (phone ?? '').replace(/\D/g, '').slice(-10);
  const byPhone = last10.length === 10 ? `%${last10}` : null;
  const mail = email?.trim().toLowerCase() || null;
  if (!byPhone && !mail) return { visitorId: null, memberId: null };

  const [visitor] = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM "Visitor"
     WHERE "tenantId" = ${tenantId} AND "archivedAt" IS NULL
       AND ((${byPhone}::text IS NOT NULL AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') LIKE ${byPhone})
         OR (${mail}::text IS NOT NULL AND lower(email) = ${mail}))
     ORDER BY "submittedAt" ASC LIMIT 1`);
  const [member] = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id FROM "Member"
     WHERE "tenantId" = ${tenantId}
       AND ((${byPhone}::text IS NOT NULL AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') LIKE ${byPhone})
         OR (${mail}::text IS NOT NULL AND lower(email) = ${mail}))
     ORDER BY "joinedAt" ASC LIMIT 1`);
  return { visitorId: visitor?.id ?? null, memberId: member?.id ?? null };
}

/** A UTC instant as its Lagos calendar date, at UTC midnight, the way a DATE column stores it. */
export function lagosDay(instant: Date): Date {
  const local = new Date(instant.getTime() + 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}
