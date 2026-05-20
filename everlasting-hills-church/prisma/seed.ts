import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await db.tenant.upsert({
    where: { slug: "ehc-main" },
    update: { name: "Everlasting Hills Church" },
    create: {
      name: "Everlasting Hills Church",
      slug: "ehc-main",
    },
  });

  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`   id:   ${tenant.id}`);
  console.log(`   slug: ${tenant.slug}`);
  console.log(
    `\n👉 Add this to .env.local:\n   DEFAULT_TENANT_ID=${tenant.id}\n`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
