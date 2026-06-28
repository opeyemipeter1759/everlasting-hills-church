import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationEvents,
  type SendEmailPayload,
} from '../notifications/notification-events';
import { EMAIL_QUEUE, EMAIL_JOB_SEND } from './jobs.constants';

/**
 * Abstraction over "how do we get this email delivered". Two implementations
 * are wired by JobsModule depending on whether Redis is configured:
 *
 *   QueueMailDispatcher  → durable BullMQ queue with retries (Redis present)
 *   EventMailDispatcher  → in-process EventEmitter, fire-and-forget (no Redis)
 *
 * Callers depend only on this token, so they never need to know which is active.
 */
export abstract class MailDispatcher {
  abstract dispatch(payload: SendEmailPayload): Promise<void>;
}

/** Redis-backed path: enqueue with retry + exponential backoff. */
@Injectable()
export class QueueMailDispatcher extends MailDispatcher {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue) {
    super();
  }

  async dispatch(payload: SendEmailPayload): Promise<void> {
    await this.queue.add(EMAIL_JOB_SEND, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }
}

/** Fallback path: dispatch in-process via EventEmitter (no retries, no Redis). */
@Injectable()
export class EventMailDispatcher extends MailDispatcher {
  constructor(private readonly events: EventEmitter2) {
    super();
  }

  async dispatch(payload: SendEmailPayload): Promise<void> {
    this.events.emit(NotificationEvents.SendEmail, payload);
  }
}
