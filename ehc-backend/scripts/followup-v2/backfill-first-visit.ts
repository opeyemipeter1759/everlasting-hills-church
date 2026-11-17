/**
 * Follow-up v2, data step 1: every first-timer gets a church-local first
 * visit date, and the FORM visit for that date.
 *
 * Visitor.firstVisitDate becomes the Lagos date of the service they registered
 * at (Visitor.serviceId), or of submittedAt when there is none. Only rows with
 * no date are touched, so a staff correction is never overwritten. The FORM
 * visit is added only where the person has none. Idempotent: a second run
 * finds nothing to do.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-first-visit.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-first-visit.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import { Prisma, type PrismaClient } from '@prisma/client';
import { runDataScript } from './data-script';

const lagos = (column: Prisma.Sql) => Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Lagos')::date`;

export interface FirstVisitPlan {
  /** Forms with no first visit date yet. */
  missingDate: number;
  /** Of those, how many take the date of their registration service. */
  fromService: number;
  /** Forms with no FORM visit yet. */
  missingFormVisit: number;
}

export async function planFirstVisit(prisma: PrismaClient, tenantId: string): Promise<FirstVisitPlan> {
  const [plan] = await prisma.$queryRaw<FirstVisitPlan[]>(Prisma.sql`
    SELECT COUNT(*) FILTER (WHERE v."firstVisitDate" IS NULL)::int AS "missingDate",
           COUNT(*) FILTER (WHERE v."firstVisitDate" IS NULL AND s.id IS NOT NULL)::int AS "fromService",
           COUNT(*) FILTER (WHERE NOT EXISTS (
             SELECT 1 FROM "FirstTimerVisit" fv WHERE fv."visitorId" = v.id AND fv.source = 'FORM'))::int AS "missingFormVisit"
      FROM "Visitor" v
      LEFT JOIN "Service" s ON s.id = v."serviceId"
     WHERE v."tenantId" = ${tenantId}`);
  return plan;
}

/** Writes the dates, then the FORM visits, in one transaction; returns how many rows each step wrote. */
export async function applyFirstVisit(prisma: PrismaClient, tenantId: string): Promise<{ dates: number; formVisits: number }> {
  const [dates, formVisits] = await prisma.$transaction([
    prisma.$executeRaw(Prisma.sql`
      UPDATE "Visitor" v
         SET "firstVisitDate" = COALESCE(
               (SELECT ${lagos(Prisma.sql`s."scheduledAt"`)} FROM "Service" s WHERE s.id = v."serviceId"),
               ${lagos(Prisma.sql`v."submittedAt"`)})
       WHERE v."tenantId" = ${tenantId} AND v."firstVisitDate" IS NULL`),
    // A visit already on that date (any source) is the same visit, so it is left alone.
    prisma.$executeRaw(Prisma.sql`
      INSERT INTO "FirstTimerVisit" (id, "tenantId", "visitorId", "visitedOn", source)
      SELECT gen_random_uuid()::text, v."tenantId", v.id, v."firstVisitDate", 'FORM'
        FROM "Visitor" v
       WHERE v."tenantId" = ${tenantId} AND v."firstVisitDate" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "FirstTimerVisit" fv WHERE fv."visitorId" = v.id AND fv.source = 'FORM')
      ON CONFLICT ("visitorId", "visitedOn") DO NOTHING`),
  ]);
  return { dates, formVisits };
}

if (require.main === module) {
  runDataScript('backfill-first-visit', async ({ prisma, tenantId, apply }) => {
    const plan = await planFirstVisit(prisma, tenantId);
    console.log(`First visit dates to set: ${plan.missingDate} (${plan.fromService} from their service, ${plan.missingDate - plan.fromService} from when they submitted)`);
    console.log(`FORM visits to add:       ${plan.missingFormVisit}`);
    const sample = await prisma.$queryRaw<{ name: string; service: string | null; submitted: string }[]>(Prisma.sql`
      SELECT v."firstName" || ' ' || v."lastName" AS name,
             to_char(${lagos(Prisma.sql`s."scheduledAt"`)}, 'YYYY-MM-DD') AS service,
             to_char(${lagos(Prisma.sql`v."submittedAt"`)}, 'YYYY-MM-DD') AS submitted
        FROM "Visitor" v LEFT JOIN "Service" s ON s.id = v."serviceId"
       WHERE v."tenantId" = ${tenantId} AND v."firstVisitDate" IS NULL
       ORDER BY v."submittedAt" LIMIT 10`);
    for (const r of sample) console.log(`  ${r.name}: ${r.service ?? r.submitted}${r.service ? ' (service)' : ' (submitted)'}`);
    if (!apply) return;
    const done = await applyFirstVisit(prisma, tenantId);
    console.log(`\nSet ${done.dates} first visit date(s) and added ${done.formVisits} FORM visit(s).`);
  });
}
