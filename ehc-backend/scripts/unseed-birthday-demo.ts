/**
 * Reverts scripts/seed-birthday-demo.ts: deletes the demo members/greetings and
 * clears the super admin's demo birthday. Run with `npx ts-node scripts/unseed-birthday-demo.ts`.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  const superAdminEmail = process.env.DEFAULT_SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!tenantId || !superAdminEmail) {
    throw new Error('DEFAULT_TENANT_ID / DEFAULT_SUPER_ADMIN_EMAIL not set in .env');
  }

  const dummyMembers = await prisma.member.findMany({
    where: { tenantId, email: { endsWith: '@example.invalid' } },
  });
  const dummyIds = dummyMembers.map((m) => m.id);

  if (dummyIds.length > 0) {
    await prisma.birthdayGreeting.deleteMany({ where: { authorMemberId: { in: dummyIds } } });
    await prisma.member.deleteMany({ where: { id: { in: dummyIds } } });
    await prisma.profile.deleteMany({ where: { id: { in: dummyMembers.map((m) => m.profileId) } } });
    console.log(`Removed ${dummyIds.length} demo members and their greetings.`);
  } else {
    console.log('No demo members found.');
  }

  const superAdminMember = await prisma.member.findFirst({ where: { tenantId, email: superAdminEmail } });
  if (superAdminMember) {
    await prisma.birthdayGreeting.deleteMany({ where: { memberId: superAdminMember.id } });
    await prisma.member.update({ where: { id: superAdminMember.id }, data: { dateOfBirth: null } });
    console.log(`Cleared ${superAdminEmail}'s demo birthday and received greetings.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
