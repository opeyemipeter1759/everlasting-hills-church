/**
 * One-off backfill: sets Visitor.serviceId for existing rows created before that
 * column existed, by matching submittedAt to the Service scheduled on the same
 * WAT calendar day. Idempotent — only touches rows where serviceId IS NULL, so
 * it's safe to re-run. Run with `npx ts-node --transpile-only scripts/backfill-visitor-service.ts`.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WAT_OFFSET_MS = 60 * 60 * 1000;

function dayBounds(at: Date) {
  const localAt = new Date(at.getTime() + WAT_OFFSET_MS);
  const midnightWAT = Date.UTC(localAt.getUTCFullYear(), localAt.getUTCMonth(), localAt.getUTCDate());
  const startUtc = new Date(midnightWAT - WAT_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID not set in .env');

  const visitors = await prisma.visitor.findMany({
    where: { tenantId, serviceId: null },
    select: { id: true, submittedAt: true },
  });

  let matched = 0;
  for (const v of visitors) {
    const { startUtc, endUtc } = dayBounds(v.submittedAt);
    const service = await prisma.service.findFirst({
      where: { tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      select: { id: true },
    });
    if (service) {
      await prisma.visitor.update({ where: { id: v.id }, data: { serviceId: service.id } });
      matched += 1;
    }
  }

  console.log(`Backfilled ${matched} of ${visitors.length} visitor(s) without a serviceId.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
