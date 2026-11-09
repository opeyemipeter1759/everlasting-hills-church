import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * A deactivated member serves on no team. This takes the given members off
 * every unit and ends any unit lead assignment they hold, so a unit they led
 * is left without a lead rather than led by someone who has gone.
 *
 * Lead assignments are ended, not deleted, so the history of who led stays.
 * The teams each person was on go into the audit log first: reactivating
 * someone does not put them back, and whoever does it can see where they served.
 *
 * Returns the profiles whose unit lead role ended, so the caller can refresh
 * their effective roles once the change is committed.
 */
export async function leaveServiceTeams(
  db: Prisma.TransactionClient,
  tenantId: string,
  memberIds: string[],
  actorId: string | null = null,
): Promise<string[]> {
  const members = await db.member.findMany({
    where: { tenantId, id: { in: memberIds } },
    select: { id: true, profileId: true },
  });
  if (members.length === 0) return [];
  const ids = members.map((m) => m.id);

  const memberships = await db.unitMember.findMany({
    where: { tenantId, memberId: { in: ids } },
    select: {
      memberId: true,
      unitId: true,
      isLead: true,
      isAssistant: true,
      positionId: true,
      joinedAt: true,
      Unit: { select: { name: true } },
    },
    orderBy: { Unit: { name: 'asc' } },
  });
  if (memberships.length > 0) {
    const teamsOf = new Map<string, Prisma.InputJsonObject[]>();
    for (const m of memberships) {
      const team = {
        unitId: m.unitId,
        unitName: m.Unit.name,
        isLead: m.isLead,
        isAssistant: m.isAssistant,
        positionId: m.positionId,
        joinedAt: m.joinedAt.toISOString(),
      };
      teamsOf.set(m.memberId, [...(teamsOf.get(m.memberId) ?? []), team]);
    }
    await db.auditLog.createMany({
      data: [...teamsOf].map(([memberId, teams]) => ({
        id: randomUUID(),
        tenantId,
        actorId,
        action: 'LEFT_SERVICE_TEAMS',
        entity: 'Member',
        entityId: memberId,
        before: { teams },
      })),
    });
    await db.unitMember.deleteMany({ where: { tenantId, memberId: { in: ids } } });
  }

  const leads = await db.unitLeadAssignment.findMany({
    where: { tenantId, userId: { in: members.map((m) => m.profileId) }, endedAt: null },
    select: { id: true, userId: true },
  });
  if (leads.length > 0) {
    await db.unitLeadAssignment.updateMany({
      where: { id: { in: leads.map((l) => l.id) } },
      data: { endedAt: new Date() },
    });
  }
  return [...new Set(leads.map((l) => l.userId))];
}
