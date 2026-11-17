import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { OutboxRegistry } from './outbox.registry';
import { OutboxService } from './outbox.service';

/**
 * The outbox against a disposable Postgres with the migrations applied. Set
 * PIPELINE_TEST_DATABASE_URL to run it; skipped otherwise.
 */
const url = process.env.PIPELINE_TEST_DATABASE_URL;
const maybe = url ? describe : describe.skip;

maybe('OutboxService against Postgres', () => {
  const prisma = url ? new PrismaClient({ datasources: { db: { url } } }) : (null as unknown as PrismaClient);
  const tenantId = randomUUID();
  const push = { dispatch: jest.fn().mockResolvedValue({}) };
  const registry = new OutboxRegistry();
  const outbox = new OutboxService(prisma as never, registry, push as never);
  let actor: string;
  let lead: string;
  let pastor: string;
  jest.setTimeout(60_000);

  beforeAll(async () => {
    await prisma.tenant.create({ data: { id: tenantId, name: 'Outbox test', slug: `outbox-${tenantId}` } });
    const profile = async () => (await prisma.profile.create({ data: { id: randomUUID(), userId: randomUUID(), tenantId } })).id;
    [actor, lead, pastor] = [await profile(), await profile(), await profile()];
    registry.register({
      type: 'test.decided',
      // The pastor holds two roles, so is listed twice; the actor is listed too.
      recipients: async () => [lead, pastor, pastor, actor],
      message: () => ({ title: 'Ada was approved', body: 'Open to see the decision', link: '/dashboard' }),
      push: { category: 'followUpUpdates' },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { tenantId } });
    await prisma.outboxEvent.deleteMany({ where: { tenantId } });
    await prisma.profile.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('leaves no event behind when the change rolls back', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await outbox.record(tx as never, { tenantId, type: 'test.decided', payload: {}, actorId: actor });
        throw new Error('the change failed');
      }),
    ).rejects.toThrow('the change failed');
    expect(await prisma.outboxEvent.count({ where: { tenantId } })).toBe(0);
  });

  it('tells each person once, never the actor, and a retry creates no duplicate', async () => {
    const id = await prisma.$transaction((tx) => outbox.record(tx as never, { tenantId, type: 'test.decided', payload: {}, actorId: actor }));
    await outbox.dispatchNow([id]);

    const inApp = await prisma.notification.findMany({ where: { eventId: id, channel: 'in_app' }, select: { profileId: true } });
    expect(inApp.map((n) => n.profileId).sort()).toEqual([lead, pastor].sort());
    expect(push.dispatch).toHaveBeenCalledTimes(1);

    // A second delivery of the same event (a sweeper retry) adds nothing.
    await prisma.outboxEvent.update({ where: { id }, data: { status: 'PENDING', nextAttemptAt: new Date(0) } });
    await outbox.sweep();
    expect(await prisma.notification.count({ where: { eventId: id, channel: 'in_app' } })).toBe(2);
    expect(push.dispatch).toHaveBeenCalledTimes(1);
    expect((await prisma.outboxEvent.findUnique({ where: { id } }))?.status).toBe('DISPATCHED');
  });

  it('sends a fresh event at once even when the app clock runs ahead of the database', async () => {
    const id = await prisma.$transaction((tx) => outbox.record(tx as never, { tenantId, type: 'test.decided', payload: {}, actorId: actor }));
    // As if the app server stamped it a minute ahead of the database's clock.
    await prisma.outboxEvent.update({ where: { id }, data: { nextAttemptAt: new Date(Date.now() + 60_000) } });
    await outbox.dispatchNow([id]);
    expect((await prisma.outboxEvent.findUnique({ where: { id } }))?.status).toBe('DISPATCHED');
    // Claimed once, it is not claimed again while its lease runs.
    await outbox.dispatchNow([id]);
    expect((await prisma.outboxEvent.findUnique({ where: { id } }))?.attempts).toBe(1);
  });

  it('backs off and finally marks an event failed', async () => {
    const id = await prisma.$transaction((tx) => outbox.record(tx as never, { tenantId, type: 'test.unknown', payload: {} }));
    for (let i = 0; i < 5; i++) {
      await prisma.outboxEvent.update({ where: { id }, data: { nextAttemptAt: new Date(0) } });
      await outbox.sweep();
    }
    const event = await prisma.outboxEvent.findUnique({ where: { id } });
    expect(event?.status).toBe('FAILED');
    expect(event?.attempts).toBe(5);
  });
});
