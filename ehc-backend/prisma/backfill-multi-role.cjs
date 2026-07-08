/**
 * Idempotent backfill from the legacy single Profile.role (and UnitMember.isLead)
 * into the new grants + assignments model. Run BEFORE renaming Profile.role.
 *
 *   node prisma/backfill-multi-role.cjs
 *
 * Uses raw SQL so it does not depend on a regenerated client. Reports what it
 * created and flags users that need manual review.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1) Granted roles (PASTOR / ADMIN / SUPER_ADMIN) -> RoleGrant
  const grants = await prisma.$executeRawUnsafe(`
    INSERT INTO "RoleGrant" ("id","tenantId","userId","role","grantedAt")
    SELECT gen_random_uuid()::text, p."tenantId", p.id, p.role, now()
    FROM "Profile" p
    WHERE p.role IN ('PASTOR','ADMIN','SUPER_ADMIN')
      AND NOT EXISTS (
        SELECT 1 FROM "RoleGrant" g WHERE g."userId"=p.id AND g.role=p.role AND g."endedAt" IS NULL
      )`);

  // 2) HEAD_USHER -> HeadUsherAssignment
  const ushers = await prisma.$executeRawUnsafe(`
    INSERT INTO "HeadUsherAssignment" ("id","tenantId","userId","assignedAt")
    SELECT gen_random_uuid()::text, p."tenantId", p.id, now()
    FROM "Profile" p
    WHERE p.role='HEAD_USHER'
      AND NOT EXISTS (
        SELECT 1 FROM "HeadUsherAssignment" h WHERE h."userId"=p.id AND h."endedAt" IS NULL
      )`);

  // 3) Unit leads (UnitMember.isLead) -> UnitLeadAssignment (userId = Member.profileId)
  const leads = await prisma.$executeRawUnsafe(`
    INSERT INTO "UnitLeadAssignment" ("id","tenantId","unitId","userId","assignedAt")
    SELECT gen_random_uuid()::text, um."tenantId", um."unitId", m."profileId", now()
    FROM "UnitMember" um
    JOIN "Member" m ON m.id = um."memberId"
    WHERE um."isLead" = true
      AND NOT EXISTS (
        SELECT 1 FROM "UnitLeadAssignment" la WHERE la."unitId"=um."unitId" AND la."endedAt" IS NULL
      )`);

  console.log(`Backfill created: ${grants} grant(s), ${ushers} head-usher assignment(s), ${leads} unit-lead assignment(s)`);

  // Manual-review flags
  const unitLeadNoAssignment = await prisma.$queryRawUnsafe(`
    SELECT p.id, COALESCE(m."firstName"||' '||m."lastName", p.id) AS name
    FROM "Profile" p LEFT JOIN "Member" m ON m."profileId" = p.id
    WHERE p.role='UNIT_LEAD'
      AND NOT EXISTS (
        SELECT 1 FROM "UnitMember" um JOIN "Member" mm ON mm.id=um."memberId"
        WHERE mm."profileId"=p.id AND um."isLead"=true
      )`);
  const adminHeadNoDept = await prisma.$queryRawUnsafe(`
    SELECT p.id, COALESCE(m."firstName"||' '||m."lastName", p.id) AS name
    FROM "Profile" p LEFT JOIN "Member" m ON m."profileId" = p.id
    WHERE p.role='ADMIN_HEAD'
      AND NOT EXISTS (
        SELECT 1 FROM "DepartmentHead" dh WHERE dh."userId"=p.id AND dh."endedAt" IS NULL
      )`);

  if (unitLeadNoAssignment.length) {
    console.log('\n  ! MANUAL REVIEW - legacy UNIT_LEAD with no unit leadership to infer from:');
    for (const r of unitLeadNoAssignment) console.log(`      - ${r.name} (profile ${r.id})`);
  }
  if (adminHeadNoDept.length) {
    console.log('\n  ! MANUAL REVIEW - legacy ADMIN_HEAD with no active DepartmentHead row:');
    for (const r of adminHeadNoDept) console.log(`      - ${r.name} (profile ${r.id})`);
  }
  if (!unitLeadNoAssignment.length && !adminHeadNoDept.length) {
    console.log('  No users flagged for manual review.');
  }

  // Summary of resulting active rows
  const [g, u, l] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT count(*)::int n FROM "RoleGrant" WHERE "endedAt" IS NULL`),
    prisma.$queryRawUnsafe(`SELECT count(*)::int n FROM "HeadUsherAssignment" WHERE "endedAt" IS NULL`),
    prisma.$queryRawUnsafe(`SELECT count(*)::int n FROM "UnitLeadAssignment" WHERE "endedAt" IS NULL`),
  ]);
  console.log(`\nActive now -> grants: ${g[0].n}, head-usher: ${u[0].n}, unit-lead: ${l[0].n}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
