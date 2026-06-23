import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAll() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  for (const { tablename } of tables) {
    if (tablename === '_prisma_migrations') continue;
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
    console.log(`Cleared: ${tablename}`);
  }

  console.log('All tables cleared.');
}

clearAll()
  .catch((err) => console.error('Error clearing database:', err))
  .finally(() => prisma.$disconnect());