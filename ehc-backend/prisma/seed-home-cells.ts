/**
 * Seed Home Cells for Ibadan.
 * Idempotent — upserts on (tenantId, name).
 *
 * Run:  npx ts-node prisma/seed-home-cells.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

const CELLS = [
  { name: 'Bodija Light Cell',        leaderName: 'Pastor Kunle Adeyemi',  leaderPhone: '+2348012345601', meetingDay: 'Tuesday',   meetingTime: '6:30 PM', address: '14 University Road, Bodija',       state: 'Oyo', city: 'Ibadan' },
  { name: 'Agodi Fire Cell',           leaderName: 'Deaconess Funke Bello', leaderPhone: '+2348012345602', meetingDay: 'Wednesday',  meetingTime: '6:00 PM', address: '7 Agodi GRA, Ibadan',              state: 'Oyo', city: 'Ibadan' },
  { name: 'Ring Road Alive Cell',      leaderName: 'Brother Seun Olatunde', leaderPhone: '+2348012345603', meetingDay: 'Thursday',   meetingTime: '7:00 PM', address: '22 Ring Road, Ibadan',             state: 'Oyo', city: 'Ibadan' },
  { name: 'Oluyole Grace Cell',        leaderName: 'Sister Taiwo Afolabi',  leaderPhone: '+2348012345604', meetingDay: 'Monday',     meetingTime: '6:30 PM', address: '5 Oluyole Estate, Ibadan',         state: 'Oyo', city: 'Ibadan' },
  { name: 'Challenge Harvest Cell',    leaderName: 'Pastor Yemi Coker',     leaderPhone: '+2348012345605', meetingDay: 'Wednesday',  meetingTime: '5:30 PM', address: '18 Oke-Ado, Challenge, Ibadan',    state: 'Oyo', city: 'Ibadan' },
  { name: 'Jericho Glory Cell',        leaderName: 'Deacon Bode Ojo',       leaderPhone: '+2348012345606', meetingDay: 'Friday',     meetingTime: '6:00 PM', address: '3 Jericho Road, Ibadan',           state: 'Oyo', city: 'Ibadan' },
  { name: 'Iwo Road Remnant Cell',     leaderName: 'Sister Ngozi Chukwu',   leaderPhone: '+2348012345607', meetingDay: 'Thursday',   meetingTime: '6:00 PM', address: '40 Iwo Road, Ibadan',              state: 'Oyo', city: 'Ibadan' },
  { name: 'Dugbe Overflow Cell',       leaderName: 'Brother Tola Adeleke',  leaderPhone: '+2348012345608', meetingDay: 'Tuesday',    meetingTime: '7:00 PM', address: '9 Dugbe Market Road, Ibadan',      state: 'Oyo', city: 'Ibadan' },
  { name: 'Sango Praise Cell',         leaderName: 'Pastor Remi Adisa',     leaderPhone: '+2348012345609', meetingDay: 'Saturday',   meetingTime: '4:00 PM', address: '12 Sango Area, Ibadan',            state: 'Oyo', city: 'Ibadan' },
  { name: 'Molete Word Cell',          leaderName: 'Deaconess Yetunde Oni', leaderPhone: '+2348012345610', meetingDay: 'Wednesday',  meetingTime: '6:30 PM', address: '6 Molete Junction, Ibadan',        state: 'Oyo', city: 'Ibadan' },
  { name: 'Bodija Covenant Cell',      leaderName: 'Brother Dayo Salami',   leaderPhone: '+2348012345611', meetingDay: 'Monday',     meetingTime: '7:00 PM', address: '31 Bodija Market Road, Ibadan',    state: 'Oyo', city: 'Ibadan' },
  { name: 'Agodi Living Waters Cell',  leaderName: 'Sister Blessing Eze',   leaderPhone: '+2348012345612', meetingDay: 'Friday',     meetingTime: '5:00 PM', address: '2 Agodi Gate Road, Ibadan',        state: 'Oyo', city: 'Ibadan' },
];

async function main() {
  console.log(`Seeding ${CELLS.length} Home Cells for tenant: ${TENANT_ID}`);

  for (const cell of CELLS) {
    const existing = await prisma.homeCell.findFirst({
      where: { tenantId: TENANT_ID, name: cell.name },
    });

    if (existing) {
      await prisma.homeCell.update({ where: { id: existing.id }, data: cell });
      console.log(`  updated: ${cell.name}`);
    } else {
      await prisma.homeCell.create({ data: { id: randomUUID(), tenantId: TENANT_ID, ...cell } });
      console.log(`  created: ${cell.name}`);
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
