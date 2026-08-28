/**
 * One-off: promotes every DRAFT headcount to CONFIRMED.
 *
 * The usher form used to offer "Save draft" beside "Confirm headcount", and a
 * draft was excluded from getTrend() and the admin comparison — so counts that
 * had genuinely been taken never reached a report. The draft path is gone (every
 * save is now authoritative); this brings the rows written before that decision
 * in line with it.
 *
 * Dry run by default:
 *   npx ts-node --transpile-only scripts/confirm-headcount-drafts.ts
 * Apply:
 *   npx ts-node --transpile-only scripts/confirm-headcount-drafts.ts --apply
 */
import 'dotenv/config';
import { HeadcountStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID not set in .env');
  const apply = process.argv.includes('--apply');

  const drafts = await prisma.serviceHeadcount.findMany({
    where: { tenantId, status: HeadcountStatus.DRAFT },
    include: { Service: { select: { name: true, scheduledAt: true } } },
    orderBy: { Service: { scheduledAt: 'asc' } },
  });

  if (drafts.length === 0) {
    console.log('No draft headcounts. Nothing to do.');
    return;
  }

  let people = 0;
  for (const draft of drafts) {
    people += draft.total;
    console.log(
      `${draft.Service.scheduledAt.toISOString().slice(0, 10)}  ${draft.Service.name.padEnd(34)} total=${draft.total}`,
    );
  }
  console.log(`\n${drafts.length} draft(s), ${people} people in total.`);

  if (!apply) {
    console.log('Dry run. Re-run with --apply to confirm them.');
    return;
  }

  const { count } = await prisma.serviceHeadcount.updateMany({
    where: { tenantId, status: HeadcountStatus.DRAFT },
    data: { status: HeadcountStatus.CONFIRMED },
  });
  console.log(`\nConfirmed ${count} headcount(s). They now count towards attendance reports.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
