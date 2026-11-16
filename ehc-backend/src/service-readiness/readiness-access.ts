import { Role } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user';
import { meetsRole } from '../auth/guards/roles.guard';

/** The Church Administrator, per the church: Admin Head, Pastor, Super Admin (ADMIN shares Admin Head's level). */
export function isChurchAdministrator(actor: Pick<AuthUser, 'effectiveRoles'>): boolean {
  return meetsRole(actor.effectiveRoles, Role.ADMIN_HEAD);
}

/** The roles notified when a department's plan is missing. */
export const ADMINISTRATOR_ROLES: Role[] = [Role.ADMIN_HEAD, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN];

/**
 * Unit ids this person heads for readiness: units they lead (lead assignment
 * or lead/assistant on the roster), plus every unit in a department they head.
 * The manual asks for a head and an assistant or designated representative,
 * so assistants plan too.
 */
export async function unitsHeadedBy(prisma: PrismaService, tenantId: string, actor: AuthUser): Promise<string[]> {
  const ids = new Set(actor.unitLeadOf);
  const [roster, departmentUnits] = await Promise.all([
    actor.memberId
      ? prisma.unitMember.findMany({
          where: { memberId: actor.memberId, OR: [{ isLead: true }, { isAssistant: true }] },
          select: { unitId: true },
        })
      : Promise.resolve([]),
    actor.hodOf.length
      ? prisma.unit.findMany({ where: { tenantId, departmentId: { in: actor.hodOf } }, select: { id: true } })
      : Promise.resolve([]),
  ]);
  for (const r of roster) ids.add(r.unitId);
  for (const u of departmentUnits) ids.add(u.id);
  return [...ids];
}

/** Profile ids to remind about a unit's plan: its leads and assistants. */
export async function headsOfUnits(prisma: PrismaService, unitIds: string[]): Promise<Map<string, string[]>> {
  const [assignments, roster] = await Promise.all([
    prisma.unitLeadAssignment.findMany({ where: { unitId: { in: unitIds }, endedAt: null }, select: { unitId: true, userId: true } }),
    prisma.unitMember.findMany({
      where: { unitId: { in: unitIds }, OR: [{ isLead: true }, { isAssistant: true }] },
      select: { unitId: true, Member: { select: { profileId: true } } },
    }),
  ]);
  const heads = new Map<string, Set<string>>();
  const add = (unitId: string, profileId: string | null | undefined) => {
    if (!profileId) return;
    heads.set(unitId, (heads.get(unitId) ?? new Set()).add(profileId));
  };
  for (const a of assignments) add(a.unitId, a.userId);
  for (const r of roster) add(r.unitId, r.Member?.profileId);
  return new Map([...heads].map(([unitId, set]) => [unitId, [...set]]));
}
