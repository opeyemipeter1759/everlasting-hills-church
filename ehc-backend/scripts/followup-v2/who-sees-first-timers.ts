/**
 * Read-only: why does a person see the First Timers section? Prints their roles,
 * unit leads, department heads, Guest Care Coordinator assignment, and the nav
 * overrides and named grants on the First Timers pages.
 *
 *   npx ts-node --transpile-only scripts/followup-v2/who-sees-first-timers.ts "Oluwatoni"
 */
import { PrismaClient } from '@prisma/client';

const HREFS = ['/dashboard/first-timers', '/dashboard/follow-up/overview', '/dashboard/follow-up/approvals'];

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error('Pass a name to look up');
  const db = new PrismaClient();
  try {
    const members = await db.member.findMany({
      where: { OR: [{ firstName: { contains: name, mode: 'insensitive' } }, { lastName: { contains: name, mode: 'insensitive' } }] },
      select: { id: true, firstName: true, lastName: true, profileId: true },
    });
    for (const m of members) {
      const p = m.profileId;
      const [profile, grants, assignments, leads, heads, units, ftc] = await Promise.all([
        db.profile.findUnique({ where: { id: p }, select: { legacyRole: true } }),
        db.roleGrant.findMany({ where: { userId: p, endedAt: null }, select: { role: true } }),
        db.roleAssignment.findMany({ where: { profileId: p }, select: { role: true } }),
        db.unitLeadAssignment.findMany({ where: { userId: p, endedAt: null }, select: { Unit: { select: { name: true } } } }),
        db.departmentHead.findMany({ where: { userId: p, endedAt: null }, select: { Department: { select: { name: true } } } }),
        db.unitMember.findMany({ where: { memberId: m.id }, select: { isLead: true, isAssistant: true, Unit: { select: { name: true } } } }),
        db.firstTimerContactAssignment.findMany({ where: { userId: p, endedAt: null }, select: { assignedAt: true } }),
      ]);
      console.log(`\n${m.firstName} ${m.lastName} (member ${m.id}, profile ${p})`);
      console.log('  legacy role:', profile?.legacyRole);
      console.log('  role grants:', grants.map((g) => g.role));
      console.log('  role assignments:', assignments.map((a) => a.role));
      console.log('  unit lead of:', leads.map((l) => l.Unit.name));
      console.log('  department head of:', heads.map((h) => h.Department.name));
      console.log('  units:', units.map((u) => `${u.Unit.name}${u.isLead ? ' (lead)' : ''}${u.isAssistant ? ' (assistant)' : ''}`));
      console.log('  guest care coordinator:', ftc.length > 0);
      const named = await db.navPermissionGrant.findMany({ where: { itemHref: { in: HREFS }, targetId: { in: [p, m.id] } } });
      console.log('  named nav grants on First Timers pages:', named.map((g) => `${g.itemHref} (${g.type})`));
    }
    const overrides = await db.navPermission.findMany({ where: { itemHref: { in: HREFS } }, select: { itemHref: true, roles: true } });
    const unitGrants = await db.navPermissionGrant.findMany({ where: { itemHref: { in: HREFS } }, select: { itemHref: true, type: true, targetId: true } });
    console.log('\nnav role overrides on First Timers pages:', overrides);
    console.log('all named grants on First Timers pages:', unitGrants);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
