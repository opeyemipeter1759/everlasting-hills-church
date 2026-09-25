/**
 * Idempotent event seeds. Rich events use the same Event, EventSchedule and
 * EventSection records that the admin builder writes.
 *
 * Run: npx ts-node prisma/seed-events.ts
 */
import 'dotenv/config';
import { EventLocationType, EventSectionType, EventStatus, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/** The church's own channel — where the watches are streamed. An admin can
 * point Join Live somewhere else at any time from Event Management. */
const CHURCH_YOUTUBE = 'https://youtube.com/@everlastinghillschurch';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID is not set in the environment (.env)');

  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, name: 'Everlasting Hills Church', slug: 'everlasting-hills' },
    update: {},
  });

  const now = new Date();
  const heaven = await prisma.event.upsert({
    where: { tenantId_slug: { tenantId, slug: 'heaven-on-earth' } },
    update: { updatedAt: now },
    create: {
      id: randomUUID(), tenantId, slug: 'heaven-on-earth', title: 'Heaven on Earth',
      tagline: "Experience God's presence, powerful worship, transformational teaching, and a gathering designed to awaken hearts and strengthen faith.",
      description: "Join us for a gathering where faith is strengthened, lives are transformed, and hearts are awakened to God's presence.",
      startAt: new Date('2026-08-15T17:00:00+01:00'), endAt: new Date('2026-08-15T21:00:00+01:00'),
      venueName: 'Hills Auditorium', venueAddress: 'Everlasting Hills Church, Ibadan, Oyo State',
      flyerImageUrl: '/events/heaven-on-earth.jpg', coverImageUrl: '/events/heaven-on-earth.jpg',
      hostName: 'Pastor Bowale Okunola', guestMinister: 'TBA — to be announced',
      contactPhone: '+234 706 872 7719', contactEmail: 'events@everlastinghills.org', contactWhatsapp: 'https://wa.me/2347068727719',
      status: EventStatus.PUBLISHED, featured: true, rsvpEnabled: true, registrationRequired: true,
      customPath: '/events/heaven-on-earth', order: 0, publishedAt: now, updatedAt: now,
    },
  });
  console.log(`Seeded event "${heaven.title}" (${heaven.id}) → ${heaven.customPath}`);

  const existing = await prisma.event.findUnique({ where: { tenantId_slug: { tenantId, slug: 'furnace-2026' } } });
  const poster = existing?.coverImageUrl ?? existing?.flyerImageUrl ?? null;
  const furnaceData = {
    tenantId, slug: 'furnace-2026', title: 'Furnace 2026', theme: 'Dominion', tagline: 'Dominion',
    shortDescription: '30 Days of sustained Prayer, Word and Spiritual Intensity, with Fasting.',
    description: '30 Days of sustained Prayer, Word and Spiritual Intensity, with Fasting.',
    startAt: new Date('2026-10-02T00:00:00+01:00'), endAt: new Date('2026-10-31T23:59:59+01:00'),
    timezone: 'Africa/Lagos', locationType: EventLocationType.ONLINE, venueName: 'Online', venueAddress: null,
    coverImageUrl: poster, flyerImageUrl: poster, liveUrl: CHURCH_YOUTUBE, testimonyUrl: '/testimony',
    primaryCtaLabel: 'Join Live', primaryCtaUrl: null, secondaryCtaLabel: null, secondaryCtaUrl: null,
    seoTitle: 'Furnace 2026 — Dominion | Everlasting Hills Church',
    seoDescription: 'Join Everlasting Hills Church for Furnace 2026: 30 days of sustained prayer, Word and spiritual intensity from October 2–31, meeting daily at 6 AM and 8 PM WAT.',
    status: EventStatus.PUBLISHED, featured: true, rsvpEnabled: false, registrationRequired: false,
    customPath: null, publishedAt: existing?.publishedAt ?? now, updatedAt: now,
  };
  const furnace = await prisma.event.upsert({
    where: { tenantId_slug: { tenantId, slug: 'furnace-2026' } },
    update: furnaceData,
    create: { id: randomUUID(), ...furnaceData },
  });

  await prisma.$transaction([
    prisma.eventSchedule.deleteMany({ where: { tenantId, eventId: furnace.id } }),
    prisma.eventSection.deleteMany({ where: { tenantId, eventId: furnace.id } }),
  ]);
  await prisma.eventSchedule.createMany({ data: [
    { id: randomUUID(), tenantId, eventId: furnace.id, title: 'Morning Watch', startTime: '06:00', recurrenceRule: 'DAILY', sortOrder: 0, updatedAt: now },
    { id: randomUUID(), tenantId, eventId: furnace.id, title: 'Evening Watch', startTime: '20:00', recurrenceRule: 'DAILY', sortOrder: 1, updatedAt: now },
  ] });
  await prisma.eventSection.createMany({ data: furnaceSections(tenantId, furnace.id, now) });
  console.log(`Seeded rich event "${furnace.title}" (${furnace.id}) → /events/${furnace.slug}`);
}

function furnaceSections(tenantId: string, eventId: string, updatedAt: Date) {
  const row = (type: EventSectionType, sortOrder: number, title: string, subtitle: string, content: object, isVisible = true) => ({
    id: randomUUID(), tenantId, eventId, type, title, subtitle, content, sortOrder, isVisible, updatedAt,
  });
  return [
    row(EventSectionType.RICH_TEXT, 0, 'Thirty Days in the Furnace', 'Furnace 2026', { body: 'Furnace is a sustained season of prayer, the Word, spiritual intensity and fasting. For thirty days, we gather twice daily to seek God, grow in spiritual fervency and make room for His transforming work.' }),
    row(EventSectionType.EXPECTATIONS, 1, 'Our Expectations', 'What we are believing for', { items: [
      { title: 'Spiritual Restoration & Fervency', description: 'A season of renewed hunger for God, restored spiritual strength, and fresh fervency in prayer, the Word, and fellowship with God.' },
      { title: "Continuous Expressions of God's Power", description: 'We are believing for increasing and continuous expressions of the power of God at work in and through the believer.' },
      { title: 'Revelations & Encounters', description: 'We are expecting illumination through the Word, deeper revelation of Christ, and genuine encounters with God that transform lives.' },
      { title: 'Miracles & Healing', description: 'We are believing God for miracles, healing, restoration, supernatural intervention, and testimonies throughout Furnace.' },
      { title: 'Direction & Divine Leading', description: 'We are trusting God for clarity, wisdom, instruction, and divine direction concerning lives, families, callings, careers, ministries, and decisions.' },
    ] }),
    row(EventSectionType.SCHEDULE, 2, 'Daily Rhythm', 'Every day · October 2–31', { introduction: 'Join us twice daily throughout Furnace.', tags: ['Prayer', 'Word', 'Spiritual Intensity', 'Fasting'] }),
    row(EventSectionType.PRAYER_FOCUS, 3, 'Prayer Focus', 'Pray with understanding', { focuses: [] }),
    row(EventSectionType.RESPONSE, 4, 'Respond', 'However God is meeting you', { introduction: 'Two ways to respond during Furnace.', actions: [
      { heading: 'Have a Testimony?', body: 'Share what God has done during Furnace — healing, miracles, answered prayer, restoration, direction, encounters, and every other work of God.', buttonLabel: 'Share Your Testimony', url: '/testimony', note: 'You choose whether your testimony may be shared live during the watches, and whether it may be shared on the church’s platforms.' },
      { heading: 'Giving Your Life to Christ?', body: 'Whether you are coming to Christ for the first time or returning to Him, tell us — someone from the church will reach out to you personally.', buttonLabel: 'I Gave My Life to Christ', url: '/first-timer', note: 'For first-time decisions and rededications alike.' },
    ] }),
    row(EventSectionType.FAQ, 5, 'Frequently Asked Questions', 'Before you join', { items: [
      { question: 'What is Furnace?', answer: 'Furnace is 30 days of sustained prayer, the Word, spiritual intensity and fasting with Everlasting Hills Church.' },
      { question: 'When is Furnace 2026?', answer: 'Furnace 2026 runs from October 2 through October 31, 2026.' },
      { question: 'What time do we meet?', answer: 'We meet every day at 6:00 AM WAT for Morning Watch and 8:00 PM WAT for Evening Watch.' },
      { question: 'Do I need to register?', answer: 'No. Registration is not required for Furnace 2026.' },
      { question: 'Where can I join?', answer: 'Use the Join Live link on this page once the church has published the meeting destination.' },
      { question: 'Is Furnace online?', answer: 'Yes. Furnace 2026 is configured as an online event.' },
      { question: 'Can I invite someone?', answer: 'Yes. Use the Share Event button to send this page to family and friends.' },
    ] }),
    row(EventSectionType.CTA, 6, 'Join Us in the Furnace', 'October 2–31 · 6 AM & 8 PM WAT', { body: 'Thirty days of sustained prayer, the Word, spiritual intensity and fasting.', buttonLabel: 'Join Live', url: CHURCH_YOUTUBE }),
  ];
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
