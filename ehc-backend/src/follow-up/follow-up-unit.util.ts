import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Whether a unit is the Follow Up unit.
 *
 * Unit names are typed by admins — "Follow Up", "Follow-up", "Followup",
 * "Follow up Unit" — so an exact `name: 'Follow-Up'` lookup quietly found
 * nothing and the whole feature behaved as if the unit did not exist: an empty
 * assignee picker, and no Report or Pending tab for its own lead. Case,
 * spacing and punctuation are ignored.
 */
export function isFollowUpUnitName(name: string): boolean {
  return name.toLowerCase().replace(/[^a-z]/g, '').includes('followup');
}

/**
 * The church's Follow Up unit, or null if there isn't one. Narrowed in SQL to
 * anything containing "follow", then matched properly in code — Postgres can't
 * strip punctuation for us without a bespoke index.
 */
export async function findFollowUpUnit(
  prisma: PrismaService,
  tenantId: string,
  where: Prisma.UnitWhereInput = {},
): Promise<{ id: string; name: string; departmentId: string | null } | null> {
  const candidates = await prisma.unit.findMany({
    where: { ...where, tenantId, name: { contains: 'follow', mode: 'insensitive' } },
    select: { id: true, name: true, departmentId: true },
    orderBy: { name: 'asc' },
  });
  return candidates.find((unit) => isFollowUpUnitName(unit.name)) ?? null;
}
