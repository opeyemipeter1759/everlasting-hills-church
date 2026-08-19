/**
 * Development fixtures for exercising the calendar feed and push dispatch.
 *
 *   node scripts/seed-calendar-fixtures.cjs
 *
 * Idempotent: re-running updates the same fixed ids rather than piling up
 * duplicates. Safe to run against a dev database only.
 */
const fs = require('fs');
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TENANT = process.env.DEFAULT_TENANT_ID;

const IDS = {
  service: 'fixture-service-sunday',
  serviceCancelled: 'fixture-service-cancelled',
  serviceOvernight: 'fixture-service-overnight',
  event: 'fixture-event-conference',
  gathering: 'fixture-gathering-prayer',
};

/** Next occurrence of a given weekday at a given Lagos wall-clock hour. */
function nextWeekday(weekday, hour, minute = 0) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  // Lagos is UTC+1 year round, so the UTC instant is the wall time minus 1h.
  d.setUTCHours(hour - 1, minute, 0, 0);
  if (d < now) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

(async () => {
  if (!TENANT) throw new Error('DEFAULT_TENANT_ID missing');

  // Sunday 09:00 Lagos
  await prisma.service.upsert({
    where: { id: IDS.service },
    create: {
      id: IDS.service,
      tenantId: TENANT,
      name: 'Sunday Service',
      scheduledAt: nextWeekday(0, 9),
      durationMinutes: 150,
      location: 'Main Auditorium, Ibadan',
    },
    update: { scheduledAt: nextWeekday(0, 9), durationMinutes: 150 },
  });

  // A cancelled midweek service, to prove STATUS:CANCELLED reaches subscribers.
  await prisma.service.upsert({
    where: { id: IDS.serviceCancelled },
    create: {
      id: IDS.serviceCancelled,
      tenantId: TENANT,
      name: 'Midweek Service',
      serviceType: 'WEDNESDAY',
      scheduledAt: nextWeekday(3, 17, 30),
      durationMinutes: 90,
      cancelledAt: new Date(),
      cancelReason: 'The building is being repaired this week.',
    },
    update: { cancelledAt: new Date(), scheduledAt: nextWeekday(3, 17, 30) },
  });

  // Crosses midnight in Lagos: 22:00 -> 01:00 next day. This is the case that
  // breaks naive .ics generation, so it is a fixture rather than an afterthought.
  await prisma.service.upsert({
    where: { id: IDS.serviceOvernight },
    create: {
      id: IDS.serviceOvernight,
      tenantId: TENANT,
      name: 'Watchnight Service',
      serviceType: 'SPECIAL',
      scheduledAt: nextWeekday(5, 22),
      durationMinutes: 180,
      location: 'Main Auditorium, Ibadan',
    },
    update: { scheduledAt: nextWeekday(5, 22), durationMinutes: 180 },
  });

  const eventStart = nextWeekday(6, 10);
  await prisma.event.upsert({
    where: { id: IDS.event },
    create: {
      id: IDS.event,
      tenantId: TENANT,
      slug: 'fixture-annual-conference',
      title: 'Annual Conference',
      tagline: 'Three days of teaching and worship.',
      description: 'Long-form description that must NOT appear in the calendar feed.',
      startAt: eventStart,
      endAt: new Date(eventStart.getTime() + 8 * 3600_000),
      venueName: 'Church Auditorium',
      venueAddress: 'Ibadan, Oyo State',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      updatedAt: new Date(),
    },
    update: { startAt: eventStart, status: 'PUBLISHED', updatedAt: new Date() },
  });

  const today = new Date();
  await prisma.recurringGathering.upsert({
    where: { id: IDS.gathering },
    create: {
      id: IDS.gathering,
      tenantId: TENANT,
      title: 'Daily Prayer Meeting',
      description: 'We pray together every morning online.',
      recurrenceRule: 'FREQ=DAILY',
      startDate: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
      startTime: '05:30',
      durationMinutes: 60,
      joinUrl: 'https://meet.google.com/ehc-prayer',
      isActive: true,
      updatedAt: new Date(),
    },
    update: { isActive: true, updatedAt: new Date() },
  });

  // Roster the first member onto the Sunday service so the feed has a serving
  // entry to mark distinctly.
  const member = await prisma.member.findFirst({
    where: { tenantId: TENANT },
    select: { id: true, profileId: true, firstName: true, lastName: true },
  });

  if (member) {
    await prisma.serviceAssignment.upsert({
      where: {
        serviceId_memberId_role: {
          serviceId: IDS.service,
          memberId: member.id,
          role: 'Usher',
        },
      },
      create: {
        id: 'fixture-assignment-usher',
        tenantId: TENANT,
        serviceId: IDS.service,
        memberId: member.id,
        role: 'Usher',
        updatedAt: new Date(),
      },
      update: { updatedAt: new Date() },
    });
  }

  console.log('fixtures ready');
  console.log('  tenant   ', TENANT);
  console.log('  service  ', IDS.service);
  console.log('  cancelled', IDS.serviceCancelled);
  console.log('  overnight', IDS.serviceOvernight);
  console.log('  event    ', IDS.event);
  console.log('  gathering', IDS.gathering);
  if (member) {
    console.log('  member   ', member.id, `${member.firstName} ${member.lastName}`);
    console.log('  profileId', member.profileId);
  } else {
    console.log('  member    NONE FOUND — serving assignment skipped');
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('FAILED:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
