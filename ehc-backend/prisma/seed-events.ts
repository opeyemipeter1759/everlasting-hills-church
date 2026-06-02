/**
 * One-off seed: insert the bespoke "Heaven on Earth" event as a DB record so it
 * shows up in the admin list and the public /events index. Its `customPath` points
 * at the hand-built page, so links route there instead of the generic template.
 *
 * Values mirror everlasting-hills-church/components/events/heaven-on-earth/event-constants.ts.
 * Idempotent — re-running upserts the same row (matched on tenantId + slug).
 *
 * Run:  npx ts-node prisma/seed-events.ts
 */
import 'dotenv/config';
import { EventStatus, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) {
    throw new Error('DEFAULT_TENANT_ID is not set in the environment (.env)');
  }

  const slug = 'heaven-on-earth';
  const now = new Date();

  const data = {
    tenantId,
    slug,
    title: 'Heaven on Earth',
    tagline:
      "Experience God's presence, powerful worship, transformational teaching, and a gathering designed to awaken hearts and strengthen faith.",
    description:
      "Join us for a gathering where faith is strengthened, lives are transformed, and hearts are awakened to God's presence.",
    startAt: new Date('2026-08-15T17:00:00+01:00'),
    endAt: new Date('2026-08-15T21:00:00+01:00'),
    venueName: 'Hills Auditorium',
    venueAddress: 'Everlasting Hills Church, Ibadan, Oyo State',
    flyerImageUrl: '/events/heaven-on-earth.jpg',
    hostName: 'Pastor Bowale Okunola',
    guestMinister: 'TBA — to be announced',
    contactPhone: '+234 706 872 7719',
    contactEmail: 'events@everlastinghills.org',
    contactWhatsapp: 'https://wa.me/2347068727719',
    status: EventStatus.PUBLISHED,
    featured: true,
    rsvpEnabled: true,
    customPath: '/events/heaven-on-earth',
    order: 0,
    publishedAt: now,
    updatedAt: now,
  };

  const event = await prisma.event.upsert({
    where: { tenantId_slug: { tenantId, slug } },
    update: data,
    create: { id: randomUUID(), ...data },
  });

  console.log(`Seeded event "${event.title}" (${event.id}) → ${event.customPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
