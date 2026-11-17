/**
 * Follow-up v2, data step 6: first-timer phone numbers to 234XXXXXXXXXX, the
 * form WhatsApp links need. New forms are stored this way already; this brings
 * the older ones in line.
 *
 * Visitor phones only. Member phones are left alone, because people may sign
 * in with them; WhatsApp links normalise those when the link is built.
 * A number that is not a Nigerian mobile is only trimmed, never guessed at.
 * Idempotent: a second run finds nothing to change.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/normalize-phones.ts            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/normalize-phones.ts --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import type { PrismaClient } from '@prisma/client';
import { normalizeNigerianPhone } from '../../src/common/phone.util';
import { runDataScript } from './data-script';

export interface PhoneChange {
  id: string;
  name: string;
  before: string;
  after: string;
}

/** Every first-timer whose stored phone differs from its normalised form, and how many were left as they are. */
export async function planPhones(prisma: PrismaClient, tenantId: string): Promise<{ changes: PhoneChange[]; unchanged: number; notNigerian: number }> {
  const rows = await prisma.visitor.findMany({
    where: { tenantId, phone: { not: null } },
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: { submittedAt: 'asc' },
  });
  const changes: PhoneChange[] = [];
  let unchanged = 0;
  let notNigerian = 0;
  for (const r of rows) {
    const before = r.phone!;
    const after = normalizeNigerianPhone(before);
    if (after && !/^234\d{10}$/.test(after)) notNigerian += 1;
    if (after === null || after === before) {
      unchanged += 1;
      continue;
    }
    changes.push({ id: r.id, name: `${r.firstName} ${r.lastName}`, before, after });
  }
  return { changes, unchanged, notNigerian };
}

/** Writes the changes in one transaction. Each update re-checks the old value, so a phone edited meanwhile is left alone. */
export async function applyPhones(prisma: PrismaClient, tenantId: string, changes: PhoneChange[]): Promise<number> {
  return prisma.$transaction(async (tx) => {
    let written = 0;
    for (const c of changes) {
      const { count } = await tx.visitor.updateMany({ where: { id: c.id, tenantId, phone: c.before }, data: { phone: c.after } });
      written += count;
    }
    return written;
    // One update per person over the pooler: far longer than the 5 second default.
  }, { maxWait: 20_000, timeout: 180_000 });
}

if (require.main === module) {
  runDataScript('normalize-phones', async ({ prisma, tenantId, apply }) => {
    const plan = await planPhones(prisma, tenantId);
    console.log(`First-timer phones to rewrite: ${plan.changes.length}`);
    console.log(`Already in the right form, or empty: ${plan.unchanged}`);
    console.log(`Not a Nigerian mobile (trimmed at most, never guessed): ${plan.notNigerian}\n`);
    for (const c of plan.changes) console.log(`  ${c.name}: "${c.before}" -> "${c.after}"`);
    if (!apply || plan.changes.length === 0) return;
    const written = await applyPhones(prisma, tenantId, plan.changes);
    console.log(`\nRewrote ${written} phone number(s).`);
  });
}
