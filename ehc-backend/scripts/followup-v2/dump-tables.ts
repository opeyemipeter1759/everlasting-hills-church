/**
 * Follow-up v2, before any --apply: write the tables the data scripts change
 * to JSON, so every change can be reversed by hand from the files.
 *
 * Writes Visitor, FollowUpEntry, FollowUpStatusChange, FollowUpStageHistory
 * and Notification for the tenant, one timestamped file per table, into the
 * folder given by --out (created if missing). It only reads the database, so
 * a dry run lists what it would write and how many rows, and --apply writes
 * the files. Running it again writes a new set; nothing is overwritten.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/dump-tables.ts --out=backups/followup-v2            (dry run)
 *   npx ts-node --transpile-only scripts/followup-v2/dump-tables.ts --out=backups/followup-v2 --apply
 * Tenant: DEFAULT_TENANT_ID, or --tenant=<id>.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { PrismaClient } from '@prisma/client';
import { runDataScript } from './data-script';

const PAGE = 1000;

type Reader = (prisma: PrismaClient, tenantId: string, skip: number) => Promise<unknown[]>;

/** Each table, read in pages in a fixed order so a dump is the same from run to run. */
export const TABLES: Record<string, Reader> = {
  Visitor: (p, tenantId, skip) => p.visitor.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, skip, take: PAGE }),
  FollowUpEntry: (p, tenantId, skip) => p.followUpEntry.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, skip, take: PAGE }),
  FollowUpStatusChange: (p, tenantId, skip) => p.followUpStatusChange.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, skip, take: PAGE }),
  FollowUpStageHistory: (p, tenantId, skip) => p.followUpStageHistory.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, skip, take: PAGE }),
  Notification: (p, tenantId, skip) => p.notification.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, skip, take: PAGE }),
};

export async function readTable(prisma: PrismaClient, tenantId: string, read: Reader): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let skip = 0; ; skip += PAGE) {
    const page = await read(prisma, tenantId, skip);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/** "2026-11-17T09-30-05Z": safe in a file name on every system. */
export const stamp = (now = new Date()) => now.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');

if (require.main === module) {
  runDataScript('dump-tables', async ({ prisma, tenantId, apply }) => {
    const out = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length);
    if (!out) throw new Error('Pass --out=<folder> for the JSON files');
    const folder = resolve(out);
    const when = stamp();
    if (apply) mkdirSync(folder, { recursive: true });

    for (const [table, read] of Object.entries(TABLES)) {
      const rows = await readTable(prisma, tenantId, read);
      const file = join(folder, `${when}-${table}.json`);
      if (apply) writeFileSync(file, JSON.stringify({ table, tenantId, dumpedAt: new Date().toISOString(), rows }, null, 2));
      console.log(`${table}: ${rows.length} rows ${apply ? 'written to' : 'would go to'} ${file}`);
    }
  });
}
