/**
 * Adds the five starting programs to the church's tenant, if they are missing.
 * Insert-only: a program the pastors have already edited is never touched.
 *
 *   npx ts-node --transpile-only scripts/seed-programs.ts
 *
 * Uses DATABASE_URL and DEFAULT_TENANT_ID from the environment.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedPrograms } from '../src/programs/programs.seed';

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID is not set');
  const prisma = new PrismaClient();
  try {
    const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[/?].*$/, '');
    console.log(`Seeding programs into ${host} for tenant ${tenantId}`);
    const added = await seedPrograms(prisma, tenantId);
    console.log(added.length ? `Added: ${added.join(', ')}` : 'Nothing to add: every program already exists.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
