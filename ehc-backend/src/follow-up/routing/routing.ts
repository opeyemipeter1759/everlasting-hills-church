import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/** What a rule's segment can see of a new first-timer. */
export interface RoutingSubject {
  isStudent: boolean | null;
}

/**
 * Every segment a rule can name, and who falls in it. A new segment is one
 * more line here, never a code path elsewhere.
 */
export const SEGMENTS: Record<string, (subject: RoutingSubject) => boolean> = {
  STUDENT: (s) => s.isStudent === true,
};

export const SEGMENT_KEYS = Object.keys(SEGMENTS) as [string, ...string[]];

export interface Route {
  ruleId: string;
  unitId: string;
  /** Member id. */
  assigneeId: string;
}

/** The first active rule, highest priority first, whose segment this person falls in. */
export async function matchRule(tx: Tx, tenantId: string, subject: RoutingSubject) {
  const rules = await tx.routingRule.findMany({
    where: { tenantId, active: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, segment: true, unitId: true, strategy: true },
  });
  return rules.find((r) => SEGMENTS[r.segment]?.(subject)) ?? null;
}

/**
 * The pool member with the fewest open assignments (anything not integrated or
 * opted out, archived forms left out). A tie goes to whoever was given someone
 * least recently, and anyone never given anyone goes first. Inactive members
 * and Super Admins are never picked.
 */
export async function pickLeastLoaded(tx: Tx, tenantId: string, ruleId: string): Promise<string | null> {
  const rows = await tx.$queryRaw<{ memberId: string }[]>(Prisma.sql`
    SELECT m.id AS "memberId"
      FROM "RoutingRuleMember" rm
      JOIN "Member" m ON m.id = rm."memberId" AND m."tenantId" = ${tenantId} AND m.status = 'ACTIVE'
      LEFT JOIN LATERAL (
        SELECT COUNT(*) FILTER (
                 WHERE e.stage NOT IN ('CONFIRMED', 'OPTED_OUT')
                   AND NOT EXISTS (SELECT 1 FROM "Visitor" v WHERE v.id = e."visitorId" AND v."archivedAt" IS NOT NULL)
               )::int AS open,
               MAX(e."assignedAt") AS "lastAssignedAt"
          FROM "FollowUpEntry" e
         WHERE e."tenantId" = ${tenantId} AND e."assigneeId" = m.id
      ) load ON true
     WHERE rm."ruleId" = ${ruleId}
       AND NOT EXISTS (
         SELECT 1 FROM "RoleGrant" g
          WHERE g."userId" = m."profileId" AND g.role = 'SUPER_ADMIN' AND g."endedAt" IS NULL)
     ORDER BY load.open ASC, load."lastAssignedAt" ASC NULLS FIRST, m.id ASC
     LIMIT 1`);
  return rows[0]?.memberId ?? null;
}

/**
 * Where a new first-timer goes under the routing rules, or null when no rule
 * applies (or its pool has nobody to give them to). Locks the rule's row for
 * the rest of the transaction, so two registrations at the same moment are
 * counted one after the other and never both land on the same person.
 */
export async function routeFor(tx: Tx, tenantId: string, subject: RoutingSubject): Promise<Route | null> {
  const rule = await matchRule(tx, tenantId, subject);
  if (!rule || rule.strategy !== 'LEAST_LOADED') return null;
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "RoutingRule" WHERE id = ${rule.id} FOR UPDATE`);
  const assigneeId = await pickLeastLoaded(tx, tenantId, rule.id);
  return assigneeId ? { ruleId: rule.id, unitId: rule.unitId, assigneeId } : null;
}
