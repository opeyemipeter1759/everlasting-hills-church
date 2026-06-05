/**
 * One-off backfill: copy each Profile.role into the Supabase user's app_metadata.role
 * so it rides in the signed JWT. After this, users pick up the claim on their next token
 * refresh / re-login, at which point the frontend middleware verifies role from the token
 * instead of the forgeable ehc_role cookie.
 *
 * Run:  npx ts-node prisma/backfill-role-claims.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const prisma = new PrismaClient();
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const profiles = await prisma.profile.findMany({ select: { userId: true, role: true } });
  let ok = 0;
  let failed = 0;

  for (const p of profiles) {
    try {
      const { data: current } = await admin.auth.admin.getUserById(p.userId);
      const existing = (current?.user?.app_metadata as Record<string, unknown> | undefined) ?? {};
      const { error } = await admin.auth.admin.updateUserById(p.userId, {
        app_metadata: { ...existing, role: p.role },
      });
      if (error) {
        failed++;
        console.warn(`  fail ${p.userId} (${p.role}): ${error.message}`);
      } else {
        ok++;
      }
    } catch (err) {
      failed++;
      console.warn(`  err  ${p.userId} (${p.role}): ${(err as Error).message}`);
    }
  }

  console.log(`Backfilled app_metadata.role: ${ok} ok, ${failed} failed (of ${profiles.length}).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
