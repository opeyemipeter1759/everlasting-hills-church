import { BadRequestException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PipelineRepository } from '../pipeline/pipeline.repository';
import { FollowUpAuthService } from '../follow-up/services/follow-up-auth.service';
import { stampEntryFirstContact } from '../follow-up/first-contact';
import type { AuthUser } from '../auth/types/auth-user';
import { lagosDate, lagosDayRange } from './email-budget.service';
import { MessageTemplatesService } from './message-templates.service';
import { OpeningMessageService } from './opening-message.service';
import { OpeningQueueService } from './opening-queue.service';
import { OPENING_TEMPLATE_V1 } from './opening-template.seed';
import { OPENING_KEY, WHATSAPP_MAX } from './template-variables';

/**
 * The opening message against a disposable Postgres with the migrations
 * applied. Set PIPELINE_TEST_DATABASE_URL to run it; skipped otherwise. It
 * seeds a tenant of its own and deletes it afterwards. Nothing is emailed:
 * the opening message goes out on WhatsApp only.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;
// A shared test database on a busy laptop can be slow to answer.
jest.setTimeout(120_000);

maybe('Opening message against Postgres', () => {
  // Generous waits, for this test client only: the shared test database can be slow under load.
  const slowOk = url && !url.includes('pool_timeout') ? `${url}${url.includes('?') ? '&' : '?'}pool_timeout=60&connect_timeout=60` : url;
  const prisma = slowOk
    ? new PrismaClient({ datasources: { db: { url: slowOk } }, transactionOptions: { maxWait: 60_000, timeout: 60_000 } })
    : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const config = { get: (k: string) => (k === 'DEFAULT_TENANT_ID' ? tenantId : undefined) } as never;
  const pipeline = new PipelineRepository(prisma as never, config);
  const templates = new MessageTemplatesService(prisma as never, config);
  const opening = new OpeningMessageService(prisma as never, templates, pipeline, new FollowUpAuthService(prisma as never, config), config);
  const queue = new OpeningQueueService(prisma as never, pipeline, templates, opening, config);
  const id = () => randomUUID();
  const daysAgo = (n: number) => new Date(`${lagosDate(new Date(Date.now() - n * 86_400_000))}T00:00:00Z`);

  let actor: AuthUser;
  let unitId: string;

  async function firstTimer(first: string, o: { daysAgo?: number; email?: string | null; phone?: string | null } = {}) {
    const v = await prisma.visitor.create({
      data: {
        id: id(), tenantId, firstName: first, lastName: 'Test',
        phone: o.phone === undefined ? `0803${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}` : o.phone,
        email: o.email === undefined ? `${first.toLowerCase()}@example.com` : o.email,
        firstVisitDate: daysAgo(o.daysAgo ?? 3),
        submittedAt: daysAgo(o.daysAgo ?? 3),
      },
    });
    return v.id;
  }
  const entryOf = (visitorId: string) => prisma.followUpEntry.findFirst({ where: { visitorId } });
  // Emailing is for admins; the Guest Care Coordinator sends on WhatsApp.

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Opening test', slug: `opening-${tenantId}` } });
    const profileId = (await prisma.profile.create({ data: { id: id(), userId: id(), tenantId } })).id;
    const memberId = (await prisma.member.create({ data: { id: id(), tenantId, profileId, firstName: 'Arewa', lastName: 'Contact', phone: '+234 803 111 2222' } })).id;
    unitId = (await prisma.unit.create({ data: { id: id(), tenantId, name: 'Follow Up' } })).id;
    actor = {
      userId: id(), email: 'contact@example.com', role: Role.FIRST_TIMER_CONTACT,
      effectiveRoles: [Role.MEMBER, Role.FIRST_TIMER_CONTACT], unitLeadOf: [], hodOf: [], headUsher: false,
      profileId, memberId, tenantId,
    };
  });

  afterAll(async () => {
    await prisma.messageLog.deleteMany({ where: { tenantId } });
    await prisma.messageTemplate.deleteMany({ where: { tenantId } });
    await prisma.followUpStageHistory.deleteMany({ where: { tenantId } });
    await prisma.followUpEntry.deleteMany({ where: { tenantId } });
    await prisma.firstTimerContactAssignment.deleteMany({ where: { tenantId } });
    await prisma.visitor.deleteMany({ where: { tenantId } });
    await prisma.member.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.unit.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('falls back to the original welcome email before any template is saved', async () => {
    const welcome = await opening.renderWelcomeEmail({ firstName: 'Ada', email: 'ada@example.com' });
    expect(welcome.templateVersion).toBeNull();
    expect(welcome.payload.subject).toContain('Ada');
  });

  it('blocks a save that uses an unknown placeholder, naming it, and saves nothing', async () => {
    const save = templates.save(actor, OPENING_KEY, { ...OPENING_TEMPLATE_V1, emailBody: 'Hi {{name}}, from {{churchName}} {{town}}' });
    await expect(save).rejects.toBeInstanceOf(BadRequestException);
    const thrown = (await save.catch((e: unknown) => e)) as BadRequestException;
    const err = thrown.getResponse() as { unknown: string[]; message: string };
    expect(err.unknown).toEqual(['name', 'town']);
    expect(err.message).toContain('{{name}}');
    expect(await prisma.messageTemplate.count({ where: { tenantId } })).toBe(0);
  });

  it('refuses a WhatsApp message that could pass the cap once names are filled in', async () => {
    await expect(templates.save(actor, OPENING_KEY, { ...OPENING_TEMPLATE_V1, whatsappBody: `${'x'.repeat(980)} {{contactName}}` })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves every edit as a new version, and reverts by saving the old words again', async () => {
    const v1 = await templates.save(actor, OPENING_KEY, OPENING_TEMPLATE_V1);
    const v2 = await templates.save(actor, OPENING_KEY, { ...OPENING_TEMPLATE_V1, whatsappBody: 'Hi {{firstName}}, this is {{contactName}}. Lovely to meet you!' });
    expect([v1.version, v2.version]).toEqual([1, 2]);
    expect(v2.editedById).toBe(actor.profileId);

    const v3 = await templates.revert(actor, OPENING_KEY, 1);
    expect(v3.version).toBe(3);
    expect(v3.whatsappBody).toBe(OPENING_TEMPLATE_V1.whatsappBody);
    const history = await templates.history(actor, OPENING_KEY);
    expect(history.active?.version).toBe(3);
    expect(history.versions.map((v) => v.version)).toEqual([3, 2, 1]);
    expect(history.versions[0].editedByName).toBe('Arewa Contact');
  });

  it('renders a WhatsApp send from the version in use; there is no email to send by hand', async () => {
    const v4 = await templates.save(actor, OPENING_KEY, { ...OPENING_TEMPLATE_V1, emailSubject: 'Lovely to meet you, {{firstName}}' });
    const visitorId = await firstTimer('Bisi');

    const ctx = await opening.context(actor, visitorId);
    expect(ctx.template?.version).toBe(v4.version);
    expect(ctx.whatsapp?.text).toContain('Hello Bisi, this is Arewa');
    expect(ctx.whatsapp?.text).toContain('0803 111 2222');
    expect(ctx.whatsapp?.link).toMatch(/^https:\/\/wa\.me\/2348\d{9}\?text=Hello%20Bisi/);
    expect(ctx.whatsapp!.text.length).toBeLessThanOrEqual(WHATSAPP_MAX);

    expect(ctx).not.toHaveProperty('canEmail');
    expect('bulkEmail' in opening).toBe(false);
  });

  it('a save without the email words keeps the ones already there', async () => {
    const before = (await templates.active(OPENING_KEY))!;
    const saved = await templates.save(actor, OPENING_KEY, { whatsappBody: 'Hi {{firstName}}, this is {{contactName}}. So glad you came!' });
    expect(saved).toMatchObject({ version: before.version + 1, emailSubject: before.emailSubject, emailBody: before.emailBody });
    await templates.revert(actor, OPENING_KEY, before.version);
  });

  it('stamps first contact only for the first contact of any kind, and moves NEW into follow-up', async () => {
    const visitorId = await firstTimer('Chidi');
    const version = (await templates.active(OPENING_KEY))!.version;

    const first = await opening.logWhatsApp(actor, visitorId, version);
    expect(first.firstContact).toBe(true);
    const entry = await entryOf(visitorId);
    expect(entry).toMatchObject({ unitId, stage: 'IN_PROGRESS' });
    const stampedAt = entry!.firstContactedAt;
    expect(stampedAt).not.toBeNull();
    const history = await prisma.followUpStageHistory.findMany({ where: { entryId: entry!.id } });
    expect(history).toEqual([expect.objectContaining({ fromStage: 'UNASSIGNED', toStage: 'IN_PROGRESS', reason: 'CONTACTED' })]);

    // A second send, and then a call the team logs, change nothing.
    const again = await opening.logWhatsApp(actor, visitorId, version);
    expect(again.firstContact).toBe(false);
    const call = await prisma.$transaction((tx) => stampEntryFirstContact(tx, { tenantId, entryId: entry!.id, at: new Date(), actorId: actor.profileId }));
    expect(call.stamped).toBe(false);
    expect((await entryOf(visitorId))!.firstContactedAt).toEqual(stampedAt);
    expect(await prisma.messageLog.count({ where: { visitorId, channel: 'whatsapp', templateVersion: version } })).toBe(2);
  });

  it('leaves the stage alone when someone already assigned is contacted first', async () => {
    const visitorId = await firstTimer('Dayo');
    await prisma.followUpEntry.create({ data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId, addedById: actor.profileId!, stage: 'ASSIGNED' } });
    await opening.logWhatsApp(actor, visitorId, 1);
    const entry = await entryOf(visitorId);
    expect(entry?.stage).toBe('ASSIGNED');
    expect(entry?.firstContactedAt).not.toBeNull();
  });

  it('keeps the not-yet-contacted queue oldest first and drops people once contacted', async () => {
    const older = await firstTimer('Queue-older', { daysAgo: 10 });
    const newer = await firstTimer('Queue-newer', { daysAgo: 2 });
    const tooOld = await firstTimer('Queue-too-old', { daysAgo: 120 });
    const out = await firstTimer('Queue-out', { daysAgo: 5 });
    await prisma.followUpEntry.create({ data: { id: id(), tenantId, unitId, sourceType: 'FIRST_TIMER', visitorId: out, addedById: actor.profileId!, stage: 'OPTED_OUT' } });

    const ids = (await queue.queue(actor)).rows.map((r) => r.person.visitorId);
    expect(ids.indexOf(older)).toBeLessThan(ids.indexOf(newer));
    expect(ids).not.toContain(tooOld);
    expect(ids).not.toContain(out);

    await opening.logWhatsApp(actor, older, 1);
    const after = await queue.queue(actor);
    expect(after.rows.map((r) => r.person.visitorId)).not.toContain(older);
    expect(after.total).toBe(after.rows.length);
    expect(after.rows.find((r) => r.person.visitorId === newer)?.whatsapp?.link).toContain('wa.me/234');
  });

  it('counts the email day in Lagos time', () => {
    const { start, end } = lagosDayRange(new Date('2026-01-31T23:30:00Z'));
    expect(start.toISOString()).toBe('2026-01-31T23:00:00.000Z');
    expect(end.toISOString()).toBe('2026-02-01T23:00:00.000Z');
  });

  it('renders the automatic welcome from the template, signed by the first-timer contact', async () => {
    await prisma.firstTimerContactAssignment.create({ data: { id: id(), tenantId, userId: actor.profileId! } });
    const welcome = await opening.renderWelcomeEmail({ firstName: 'Efe', email: 'efe@example.com' });
    expect(welcome.templateVersion).toBe((await templates.active(OPENING_KEY))!.version);
    expect(welcome.payload.subject).toBe('Lovely to meet you, Efe');
    expect(welcome.payload.text).toContain('Arewa');
  });
});
