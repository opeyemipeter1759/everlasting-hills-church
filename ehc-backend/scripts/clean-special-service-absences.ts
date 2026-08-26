/**
 * One-off cleanup: removes ABSENT attendance records attached to SPECIAL
 * services.
 *
 * SPECIAL covers one-off gatherings and the placeholder services the usher
 * headcount flow creates when a count is recorded for a weekday that is neither
 * Sunday nor Wednesday. Auto-marking absentees ran against those too, so members
 * ended up with an ABSENT beside a "Tuesday Service" the church never called.
 * The code no longer writes these (see AttendanceAbsenceService and
 * AttendanceHistoryService); this clears the ones already written.
 *
 * PRESENT records are never touched — if someone did attend a special service,
 * that is real and theirs to keep.
 *
 * Dry run by default, so you can see the damage before agreeing to it:
 *   npx ts-node --transpile-only scripts/clean-special-service-absences.ts
 * Apply:
 *   npx ts-node --transpile-only scripts/clean-special-service-absences.ts --apply
 */
import 'dotenv/config';
import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID not set in .env');
  const apply = process.argv.includes('--apply');

  const specialServices = await prisma.service.findMany({
    where: { tenantId, serviceType: ServiceType.SPECIAL },
    select: { id: true, name: true, scheduledAt: true },
    orderBy: { scheduledAt: 'desc' },
  });

  if (specialServices.length === 0) {
    console.log('No SPECIAL services — nothing to clean.');
    return;
  }

  const ids = specialServices.map((s) => s.id);
  const doomed = await prisma.attendanceRecord.groupBy({
    by: ['serviceId'],
    where: { tenantId, serviceId: { in: ids }, present: false },
    _count: { _all: true },
  });
  const countByService = new Map(doomed.map((row) => [row.serviceId, row._count._all]));

  let total = 0;
  for (const service of specialServices) {
    const count = countByService.get(service.id) ?? 0;
    if (count === 0) continue;
    total += count;
    console.log(
      `${service.scheduledAt.toISOString().slice(0, 10)}  ${service.name} — ${count} absent record(s)`,
    );
  }

  if (total === 0) {
    console.log('No ABSENT records on SPECIAL services. Nothing to do.');
    return;
  }

  if (!apply) {
    console.log(`\nDry run: ${total} record(s) would be deleted. Re-run with --apply to delete them.`);
    return;
  }

  const { count } = await prisma.attendanceRecord.deleteMany({
    where: { tenantId, serviceId: { in: ids }, present: false },
  });
  console.log(`\nDeleted ${count} ABSENT record(s) on SPECIAL services.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
