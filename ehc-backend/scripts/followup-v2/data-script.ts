/**
 * What every follow-up v2 data script shares: dry run unless --apply is
 * passed, the tenant from --tenant=<id> or DEFAULT_TENANT_ID, and a first line
 * that says which database it is about to read or write.
 */
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';

export interface ScriptContext {
  prisma: PrismaClient;
  tenantId: string;
  apply: boolean;
}

export function runDataScript(name: string, body: (ctx: ScriptContext) => Promise<void>): void {
  loadEnv();
  const apply = process.argv.includes('--apply');
  const tenantId = process.argv.find((a) => a.startsWith('--tenant='))?.slice('--tenant='.length) ?? process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('Set DEFAULT_TENANT_ID in .env or pass --tenant=<id>');
  let host = 'unknown database';
  try {
    host = new URL(process.env.DATABASE_URL ?? '').host;
  } catch {
    // Prisma reports a missing or bad URL itself.
  }
  const prisma = new PrismaClient();
  console.log(`${name}: ${apply ? 'APPLYING' : 'dry run'} on ${host}, tenant ${tenantId}\n`);
  body({ prisma, tenantId, apply })
    .then(() => {
      if (!apply) console.log('\nDry run: nothing was written. Re-run with --apply to write.');
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
