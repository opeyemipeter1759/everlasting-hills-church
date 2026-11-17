import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PushDispatchService } from '../push/services/push-dispatch.service';
import { OutboxRegistry } from './outbox.registry';
import { MAX_ATTEMPTS, backoffMs, type RecordEventInput } from './outbox.types';

/** Long enough for a push service to answer, short enough not to hold the request. */
const PUSH_TIMEOUT_MS = 4_000;
/** How long a claimed event is left alone before another dispatcher may take it. */
const LEASE_MS = 5 * 60_000;
const SWEEP_BATCH = 50;

type Tx = Prisma.TransactionClient;

/**
 * The notification outbox.
 *
 * `record` writes the event in the caller's transaction, so there is never an
 * event without the change it describes, nor a change without its event.
 * `dispatch` runs after the commit, still inside the request (Cloud Run starves
 * work left running after the response): it writes one notification row per
 * recipient and attempts the push. The scheduled `sweep` retries whatever was
 * left behind, with backoff, and gives up after five attempts.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: OutboxRegistry,
    private readonly push: PushDispatchService,
  ) {}

  /** Write an event inside the caller's transaction. Returns its id, to dispatch once the transaction commits. */
  async record(tx: Tx, input: RecordEventInput): Promise<string> {
    const id = randomUUID();
    await tx.outboxEvent.create({
      data: {
        id,
        tenantId: input.tenantId,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
        actorId: input.actorId ?? null,
      },
    });
    return id;
  }

  /** Dispatch the events a request just committed. Never throws: anything that fails is left for the sweeper. */
  async dispatchNow(eventIds: string[]): Promise<void> {
    for (const id of eventIds) {
      // A fresh event (no attempt yet) is claimed whatever its nextAttemptAt says:
      // that was stamped by the app server, whose clock can run ahead of the
      // database's. Once anyone has claimed it, the lease decides.
      const claimed = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        UPDATE "OutboxEvent" SET attempts = attempts + 1, "nextAttemptAt" = now() + ${`${LEASE_MS} milliseconds`}::interval
         WHERE id = ${id} AND status = 'PENDING' AND (attempts = 0 OR "nextAttemptAt" <= now())
        RETURNING id`);
      if (claimed.length) await this.deliver(id);
    }
  }

  /** The scheduled retry: claims due events with SKIP LOCKED, so any number of sweepers can run at once. */
  async sweep(): Promise<{ dispatched: number; failed: number }> {
    const claimed = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      UPDATE "OutboxEvent" SET attempts = attempts + 1, "nextAttemptAt" = now() + ${`${LEASE_MS} milliseconds`}::interval
       WHERE id IN (
         SELECT id FROM "OutboxEvent"
          WHERE status = 'PENDING' AND "nextAttemptAt" <= now()
          ORDER BY "nextAttemptAt"
          LIMIT ${SWEEP_BATCH}
          FOR UPDATE SKIP LOCKED)
      RETURNING id`);
    let dispatched = 0;
    let failed = 0;
    for (const { id } of claimed) {
      if (await this.deliver(id)) dispatched += 1;
      else failed += 1;
    }
    return { dispatched, failed };
  }

  /** Events that ran out of attempts, for the admin view. */
  failedEvents(tenantId: string) {
    return this.prisma.outboxEvent.findMany({
      where: { tenantId, status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, attempts: true, lastError: true, createdAt: true },
    });
  }

  /** Notify every recipient of one claimed event. True when it is done. */
  private async deliver(id: string): Promise<boolean> {
    const event = await this.prisma.outboxEvent.findUnique({ where: { id } });
    if (!event || event.status !== 'PENDING') return true;
    try {
      const definition = this.registry.get(event.type);
      if (!definition) throw new Error(`No handler registered for ${event.type}`);
      const payload = event.payload as Record<string, unknown>;
      const recipients = [...new Set(await definition.recipients(payload, event.tenantId))].filter(
        (profileId) => profileId && profileId !== event.actorId,
      );
      const message = definition.message(payload);

      if (recipients.length) {
        // The unique (eventId, profileId, channel) index makes a retry skip anyone already told.
        await this.prisma.notification.createMany({
          data: recipients.map((profileId) => ({
            id: randomUUID(),
            tenantId: event.tenantId,
            profileId,
            type: event.type,
            title: message.title,
            body: message.body,
            link: message.link,
            eventId: event.id,
            channel: 'in_app',
            payload: payload as Prisma.InputJsonValue,
          })),
          skipDuplicates: true,
        });
        if (definition.push) await this.pushOnce(event.id, event.tenantId, recipients, message, definition.push.category);
      }

      await this.prisma.outboxEvent.update({ where: { id }, data: { status: 'DISPATCHED', dispatchedAt: new Date(), lastError: null } });
      return true;
    } catch (err) {
      const message = (err as Error).message.slice(0, 500);
      const failed = event.attempts >= MAX_ATTEMPTS;
      await this.prisma.outboxEvent.update({
        where: { id },
        data: {
          status: failed ? 'FAILED' : 'PENDING',
          lastError: message,
          nextAttemptAt: new Date(Date.now() + backoffMs(event.attempts)),
        },
      });
      this.logger.warn(`Outbox ${event.type} ${id} attempt ${event.attempts} failed: ${message}`);
      return false;
    }
  }

  /** Push to whoever has not had this event's push yet, recorded as a 'push' row so a retry never pushes twice. */
  private async pushOnce(
    eventId: string,
    tenantId: string,
    recipients: string[],
    message: { title: string; body: string; link: string },
    category: Parameters<PushDispatchService['dispatch']>[0],
  ) {
    const already = await this.prisma.notification.findMany({
      where: { eventId, channel: 'push', profileId: { in: recipients } },
      select: { profileId: true },
    });
    const done = new Set(already.map((n) => n.profileId));
    const due = recipients.filter((profileId) => !done.has(profileId));
    if (!due.length) return;

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('push timed out')), PUSH_TIMEOUT_MS);
    });
    try {
      await Promise.race([
        this.push.dispatch(category, { tenantId, userIds: due }, { title: message.title, body: message.body, url: message.link, tag: eventId }),
        timeout,
      ]);
    } finally {
      clearTimeout(timer);
    }
    await this.prisma.notification.createMany({
      data: due.map((profileId) => ({
        id: randomUUID(),
        tenantId,
        profileId,
        type: 'push',
        title: message.title,
        eventId,
        channel: 'push',
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }
}
