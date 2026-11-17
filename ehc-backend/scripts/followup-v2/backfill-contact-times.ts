/**
 * Follow-up v2, data step 4: the times the 48-hour metric and the routing
 * tie-break read.
 *
 * - firstContactedAt: the earliest contact the team logged on a first-timer's
 *   entry (a real contact, not a quick update), at the time it happened when
 *   the logger gave one. Contact logging began on 2026-08-21, so earlier
 *   months stay empty and read "Not tracked".
 * - assignedAt: when the current assignee was given the entry, from the
 *   latest ASSIGN audit row naming them, else the entry's creation time (the
 *   automatic assignment happens when the entry is made).
 *
 * Only empty values are filled, so a second run finds nothing to do.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-contact-times.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-contact-times.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import { Prisma, type PrismaClient } from '@prisma/client';
import { runDataScript } from './data-script';

/** First contact per first-timer entry that has none yet. */
const firstContacts = (tenantId: string) => Prisma.sql`
  SELECT e.id AS "entryId", MIN(LEAST(COALESCE(l."contactedAt", l."createdAt"), l."createdAt")) AS at
    FROM "FollowUpEntry" e
    JOIN "FollowUpContactLog" l ON l."entryId" = e.id AND l.kind = 'CONTACT'
   WHERE e."tenantId" = ${tenantId} AND e."sourceType" = 'FIRST_TIMER' AND e."firstContactedAt" IS NULL
   GROUP BY e.id`;

/** When the current assignee got each assigned entry that has no assignedAt yet. */
const assignments = (tenantId: string) => Prisma.sql`
  SELECT e.id AS "entryId",
         COALESCE(
           (SELECT MAX(a."createdAt") FROM "AuditLog" a
             WHERE a."tenantId" = e."tenantId" AND a.action = 'ASSIGN' AND a.entity = 'FollowUpEntry'
               AND a."entityId" = e.id AND a.after->>'assigneeId' = e."assigneeId"),
           e."createdAt"
         ) AS at
    FROM "FollowUpEntry" e
   WHERE e."tenantId" = ${tenantId} AND e."assigneeId" IS NOT NULL AND e."assignedAt" IS NULL`;

export interface ContactTimesPlan {
  firstContacts: { entryId: string; at: Date }[];
  assignments: { entryId: string; at: Date }[];
}

export async function planContactTimes(prisma: PrismaClient, tenantId: string): Promise<ContactTimesPlan> {
  const [contacts, assigned] = await Promise.all([
    prisma.$queryRaw<{ entryId: string; at: Date }[]>(firstContacts(tenantId)),
    prisma.$queryRaw<{ entryId: string; at: Date }[]>(assignments(tenantId)),
  ]);
  return { firstContacts: contacts, assignments: assigned };
}

/** Writes the plan. Each update keeps its IS NULL guard, so nothing already set is overwritten. */
export async function applyContactTimes(prisma: PrismaClient, tenantId: string): Promise<{ contacted: number; assigned: number }> {
  return prisma.$transaction(async (tx) => {
    const contacted = await tx.$executeRaw(Prisma.sql`
      UPDATE "FollowUpEntry" e SET "firstContactedAt" = f.at
        FROM (${firstContacts(tenantId)}) f
       WHERE e.id = f."entryId" AND e."firstContactedAt" IS NULL`);
    const assigned = await tx.$executeRaw(Prisma.sql`
      UPDATE "FollowUpEntry" e SET "assignedAt" = a.at
        FROM (${assignments(tenantId)}) a
       WHERE e.id = a."entryId" AND e."assignedAt" IS NULL`);
    return { contacted, assigned };
  });
}

if (require.main === module) {
  runDataScript('backfill-contact-times', async ({ prisma, tenantId, apply }) => {
    const plan = await planContactTimes(prisma, tenantId);
    const earliest = plan.firstContacts.reduce<Date | null>((min, r) => (!min || r.at < min ? r.at : min), null);
    console.log(`First contacts to set: ${plan.firstContacts.length}${earliest ? ` (earliest ${earliest.toISOString().slice(0, 10)})` : ''}`);
    console.log(`Assignment times to set: ${plan.assignments.length}`);
    if (!apply) return;
    const done = await applyContactTimes(prisma, tenantId);
    console.log(`\nSet ${done.contacted} first contact(s) and ${done.assigned} assignment time(s).`);
  });
}
