/**
 * Follow-up v2, data step 5: mark the students. Until v2 the form never saved
 * the student answer; it only wrote occupation "Student". So isStudent is set
 * to true where the occupation contains "student" (any case) and nobody has
 * answered the question yet. An explicit answer is never overwritten.
 * Idempotent: a second run finds nothing to do.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-students.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/backfill-students.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import { Prisma, type PrismaClient } from '@prisma/client';
import { runDataScript } from './data-script';

const students = (tenantId: string) =>
  Prisma.sql`"tenantId" = ${tenantId} AND "isStudent" IS NULL AND occupation ILIKE '%student%'`;

/** Each occupation that would be marked, with how many people gave it. */
export async function planStudents(prisma: PrismaClient, tenantId: string): Promise<{ occupation: string; n: number }[]> {
  return prisma.$queryRaw<{ occupation: string; n: number }[]>(Prisma.sql`
    SELECT occupation, COUNT(*)::int AS n FROM "Visitor" WHERE ${students(tenantId)}
     GROUP BY occupation ORDER BY n DESC, occupation`);
}

export async function applyStudents(prisma: PrismaClient, tenantId: string): Promise<number> {
  return prisma.$executeRaw(Prisma.sql`UPDATE "Visitor" SET "isStudent" = true WHERE ${students(tenantId)}`);
}

if (require.main === module) {
  runDataScript('backfill-students', async ({ prisma, tenantId, apply }) => {
    const plan = await planStudents(prisma, tenantId);
    console.log(`People to mark as students: ${plan.reduce((n, r) => n + r.n, 0)}`);
    for (const r of plan) console.log(`  ${r.n} x "${r.occupation}"`);
    if (!apply) return;
    console.log(`\nMarked ${await applyStudents(prisma, tenantId)} student(s).`);
  });
}
