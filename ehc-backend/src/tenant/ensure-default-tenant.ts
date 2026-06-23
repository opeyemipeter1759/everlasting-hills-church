import type { PrismaService } from '../prisma/prisma.service';

const DEFAULT_NAME = 'Everlasting Hills Church';
const DEFAULT_SLUG = 'everlasting-hills';

/** Idempotent: ensures the configured default tenant row exists before FK-dependent seeds. */
export async function ensureDefaultTenant(
  prisma: PrismaService,
  tenantId: string,
): Promise<void> {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, name: DEFAULT_NAME, slug: DEFAULT_SLUG },
    update: {},
  });
}
