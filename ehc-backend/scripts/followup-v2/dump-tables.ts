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

/**
 * The tables, in a fixed order. Read with plain SQL, every column the table
 * has, so the dump works before the v2 migrations run (the generated client
 * already expects the new columns) as well as after.
 */
export const TABLES = ['Visitor', 'FollowUpEntry', 'FollowUpStatusChange', 'FollowUpStageHistory', 'Notification'] as const;

/** False for a table the migrations have not created yet (FollowUpStageHistory, before v2). */
async function exists(prisma: PrismaClient, table: string): Promise<boolean> {
  const [row] = await prisma.$queryRawUnsafe<{ found: boolean }[]>('SELECT to_regclass($1) IS NOT NULL AS found', `public."${table}"`);
  return row?.found ?? false;
}

/** Every row of the tenant, in pages ordered by id so a dump is the same from run to run. Null when the table does not exist. */
export async function readTable(prisma: PrismaClient, tenantId: string, table: (typeof TABLES)[number]): Promise<unknown[] | null> {
  if (!(await exists(prisma, table))) return null;
  const rows: unknown[] = [];
  for (let skip = 0; ; skip += PAGE) {
    // The table name is one of the constants above, never input.
    const page = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM "${table}" WHERE "tenantId" = $1 ORDER BY id LIMIT ${PAGE} OFFSET ${skip}`,
      tenantId,
    );
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

    for (const table of TABLES) {
      const rows = await readTable(prisma, tenantId, table);
      if (rows === null) {
        console.log(`${table}: not created yet, nothing to keep`);
        continue;
      }
      const file = join(folder, `${when}-${table}.json`);
      const json = JSON.stringify({ table, tenantId, dumpedAt: new Date().toISOString(), rows }, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
      if (apply) writeFileSync(file, json);
      console.log(`${table}: ${rows.length} rows ${apply ? 'written to' : 'would go to'} ${file}`);
    }
  });
}
