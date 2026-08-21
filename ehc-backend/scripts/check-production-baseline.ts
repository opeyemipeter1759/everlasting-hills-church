import { PrismaClient } from '@prisma/client';

const BASELINE = '20260820000000_baseline';

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

async function checkBaseline(): Promise<void> {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error('DIRECT_URL is required for the production baseline check');
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });

  try {
    // This preflight is deliberately read-only. If the migration table does not
    // exist, the query fails and the deploy step remains blocked.
    const rows = await prisma.$queryRaw<MigrationRow[]>`
      SELECT "migration_name", "finished_at", "rolled_back_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" = ${BASELINE}
    `;

    const applied = rows.some(
      (row) => row.finished_at !== null && row.rolled_back_at === null,
    );
    if (!applied) {
      throw new Error(
        `Production migration blocked: ${BASELINE} is not recorded as successfully applied`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

void checkBaseline().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
