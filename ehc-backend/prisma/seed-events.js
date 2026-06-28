"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const DEFAULT_NAME = 'Everlasting Hills Church';
const DEFAULT_SLUG = 'everlasting-hills';
const prisma = new client_1.PrismaClient();
async function ensureDefaultTenant(tenantId) {
    await prisma.tenant.upsert({
        where: { id: tenantId },
        create: { id: tenantId, name: DEFAULT_NAME, slug: DEFAULT_SLUG },
        update: {},
    });
}
async function main() {
    const tenantId = process.env.DEFAULT_TENANT_ID;
    if (!tenantId) {
        throw new Error('DEFAULT_TENANT_ID is not set in the environment (.env)');
    }
    await ensureDefaultTenant(tenantId);
    const slug = 'heaven-on-earth';
    const now = new Date();
    const data = {
        tenantId,
        slug,
        title: 'Heaven on Earth',
        tagline: "Experience God's presence, powerful worship, transformational teaching, and a gathering designed to awaken hearts and strengthen faith.",
        description: "Join us for a gathering where faith is strengthened, lives are transformed, and hearts are awakened to God's presence.",
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
        status: client_1.EventStatus.PUBLISHED,
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
        create: { id: (0, crypto_1.randomUUID)(), ...data },
    });
    console.log(`Seeded event "${event.title}" (${event.id}) → ${event.customPath}`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-events.js.map