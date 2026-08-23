/**
 * One-off privacy fix: for existing testimonials submitted through the public
 * form, contact info (email/phone) was mistakenly stored in authorRole — the
 * field rendered publicly as the byline on the homepage. Moves any authorRole
 * that looks like contact info into the new admin-only submitterContact field
 * and clears authorRole. Idempotent — only touches rows matching the pattern,
 * safe to re-run. Run with `npx ts-node --transpile-only scripts/backfill-testimonial-contact.ts`.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Matches what testimony-form.service.ts used to write: "email · phone", "email", or "phone".
const CONTACT_LIKE = /@|^\+?[\d\s()-]{6,}$| · /;

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID not set in .env');

  const candidates = await prisma.testimonial.findMany({
    where: { tenantId, authorRole: { not: null } },
    select: { id: true, authorRole: true },
  });

  const toFix = candidates.filter((t) => t.authorRole && CONTACT_LIKE.test(t.authorRole));

  for (const t of toFix) {
    await prisma.testimonial.update({
      where: { id: t.id },
      data: { submitterContact: t.authorRole, authorRole: null },
    });
  }

  console.log(`Fixed ${toFix.length} of ${candidates.length} testimonial(s) with a role field.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
