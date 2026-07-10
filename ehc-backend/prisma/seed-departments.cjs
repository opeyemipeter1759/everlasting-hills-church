/**
 * Idempotent seed for the seven Administrative Departments and the Service Unit
 * mapping. Matches existing units case-insensitively with "Team"/"Unit" suffix
 * tolerance and links them; creates missing units; creates Student Coordination
 * unassigned (department_id = NULL); reports any existing units it could not map.
 *
 *   node prisma/seed-departments.cjs
 *
 * Safe to re-run: departments match on (tenantId, code), units on normalized name.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

const DEPARTMENTS = [
  { code: 'OSM', name: 'Operations & Service Management', sortOrder: 1 },
  { code: 'MA', name: 'Membership & Assimilation', sortOrder: 2 },
  { code: 'CI', name: 'Communication & Information Flow', sortOrder: 3 },
  { code: 'FIN', name: 'Finance', sortOrder: 4 },
  { code: 'DATA', name: 'Data & Systems', sortOrder: 5 },
  { code: 'WPC', name: 'Welfare & Pastoral Care', sortOrder: 6 },
  { code: 'GO', name: 'Growth & Outreach', sortOrder: 7 },
];

// Canonical unit name -> department code. Sanitation under OSM (mapping table);
// Evangelism + Outreach are two units under GO; Follow-Up/First-Timers/Integration
// are three units under MA; Records & Database & Website is one unit under DATA.
const UNIT_MAP = [
  ['Production', 'OSM'],
  ['Worship', 'OSM'],
  ['Ushering', 'OSM'],
  ['Children', 'OSM'],
  ['Service Coordination', 'OSM'],
  ['Logistics & Setup', 'OSM'],
  ['Sanitation', 'OSM'],
  ['Follow-Up', 'MA'],
  ['First-Timers', 'MA'],
  ['Integration', 'MA'],
  ['Discipleship', 'MA'],
  ['Communications', 'CI'],
  ['Social Media & Content', 'CI'],
  ['Design', 'CI'],
  ['Finance', 'FIN'],
  ['Records & Database & Website', 'DATA'],
  ['Welfare', 'WPC'],
  ['Evangelism', 'GO'],
  ['Outreach', 'GO'],
];

// Exists as a unit but is intentionally unassigned (Pastor assigns it deliberately).
const UNASSIGNED_UNITS = ['Student Coordination'];

/** Normalize a unit name for matching: lowercase, & -> and, drop punctuation and
 *  a trailing "team"/"unit", collapse whitespace. */
function norm(name) {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(team|unit)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const tenantId =
    process.env.DEFAULT_TENANT_ID?.trim() || (await prisma.tenant.findFirst())?.id;
  if (!tenantId) throw new Error('No tenant found');
  console.log('Seeding departments for tenant', tenantId);

  // 1) Departments (match on tenantId + code).
  const deptByCode = {};
  for (const d of DEPARTMENTS) {
    let dept = await prisma.department.findFirst({ where: { tenantId, code: d.code } });
    if (!dept) {
      dept = await prisma.department.create({
        data: { id: randomUUID(), tenantId, code: d.code, name: d.name, sortOrder: d.sortOrder },
      });
      console.log(`  + created department ${d.code}: ${d.name}`);
    } else {
      console.log(`  = department ${d.code} exists`);
    }
    deptByCode[d.code] = dept.id;
  }

  // 2) Existing units, indexed by normalized name.
  const existing = await prisma.unit.findMany({ where: { tenantId } });
  const byNorm = new Map();
  for (const u of existing) byNorm.set(norm(u.name), u);
  const usedIds = new Set();

  // 3) Map units to departments (link existing, create missing).
  let linked = 0;
  let created = 0;
  for (const [name, code] of UNIT_MAP) {
    const departmentId = deptByCode[code];
    const match = byNorm.get(norm(name));
    if (match) {
      usedIds.add(match.id);
      if (match.departmentId !== departmentId) {
        await prisma.unit.update({ where: { id: match.id }, data: { departmentId } });
        console.log(`  ~ linked "${match.name}" -> ${code}`);
      }
      linked++;
    } else {
      const u = await prisma.unit.create({
        data: { id: randomUUID(), tenantId, name, departmentId },
      });
      byNorm.set(norm(name), u);
      created++;
      console.log(`  + created unit "${name}" -> ${code}`);
    }
  }

  // 4) Unassigned units (create if missing; leave department_id NULL).
  for (const name of UNASSIGNED_UNITS) {
    const match = byNorm.get(norm(name));
    if (match) {
      usedIds.add(match.id);
      console.log(`  = unassigned unit "${match.name}" exists (department NULL kept)`);
    } else {
      await prisma.unit.create({ data: { id: randomUUID(), tenantId, name, departmentId: null } });
      console.log(`  + created unassigned unit "${name}"`);
    }
  }

  // 5) Report existing units we did not map (surfaced for a human to decide).
  const unmatched = existing.filter((u) => !usedIds.has(u.id) && !UNASSIGNED_UNITS.some((n) => norm(n) === norm(u.name)));
  if (unmatched.length) {
    console.log('\n  ! Existing units not mapped to any department (assign manually):');
    for (const u of unmatched) console.log(`      - "${u.name}" (id ${u.id}, department ${u.departmentId ?? 'NULL'})`);
  }

  const deptCount = await prisma.department.count({ where: { tenantId } });
  console.log(`\nDone. Departments: ${deptCount} | units linked: ${linked} | units created: ${created} | unmatched: ${unmatched.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
