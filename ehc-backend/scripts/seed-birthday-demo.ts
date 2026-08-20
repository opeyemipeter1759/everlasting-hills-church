/**
 * One-off demo seed for the birthday feature. Not wired into any build/CI step —
 * run manually with `npx ts-node scripts/seed-birthday-demo.ts` and delete afterward.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

function dateOffsetFromToday(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  const superAdminEmail = process.env.DEFAULT_SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!tenantId || !superAdminEmail) {
    throw new Error('DEFAULT_TENANT_ID / DEFAULT_SUPER_ADMIN_EMAIL not set in .env');
  }

  const superAdminMember = await prisma.member.findFirst({ where: { tenantId, email: superAdminEmail } });
  if (!superAdminMember) {
    throw new Error(`No Member found for ${superAdminEmail} — log in once first so the bootstrap seed runs.`);
  }

  await prisma.member.update({
    where: { id: superAdminMember.id },
    data: { dateOfBirth: dateOffsetFromToday(0) },
  });
  console.log(`Set ${superAdminEmail}'s birthday to today.`);

  const dummies = [
    { firstName: 'Grace', lastName: 'Adeyemi', daysUntil: 0 },
    { firstName: 'Samuel', lastName: 'Okafor', daysUntil: 2 },
    { firstName: 'Faith', lastName: 'Nwosu', daysUntil: 5 },
  ];

  const dummyMembers: Array<{ id: string }> = [];
  for (const d of dummies) {
    const email = `demo.${d.firstName.toLowerCase()}.${d.lastName.toLowerCase()}@example.invalid`;
    const profile = await prisma.profile.create({
      data: { id: randomUUID(), userId: randomUUID(), tenantId },
    });
    const member = await prisma.member.create({
      data: {
        id: randomUUID(),
        tenantId,
        profileId: profile.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email,
        dateOfBirth: dateOffsetFromToday(d.daysUntil),
      },
    });
    dummyMembers.push(member);
    console.log(`Created dummy member ${d.firstName} ${d.lastName} (birthday in ${d.daysUntil}d).`);
  }

  const greetingMessages = [
    'Happy birthday! Praying for a year full of God\'s goodness over your life 🎉',
    'Wishing you joy and many more blessed years ahead. Happy birthday!',
  ];
  for (let i = 0; i < greetingMessages.length; i++) {
    await prisma.birthdayGreeting.create({
      data: {
        id: randomUUID(),
        tenantId,
        memberId: superAdminMember.id,
        authorMemberId: dummyMembers[i].id,
        message: greetingMessages[i],
      },
    });
  }
  console.log(`Left ${greetingMessages.length} birthday greetings for ${superAdminEmail}.`);

  console.log('\nDone. To undo, run: npx ts-node scripts/unseed-birthday-demo.ts');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
