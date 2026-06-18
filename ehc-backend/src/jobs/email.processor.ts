import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import type { SendEmailPayload } from '../notifications/notification-events';
import { EMAIL_QUEUE } from './jobs.constants';

/**
 * BullMQ worker for the email queue. Only instantiated when Redis is
 * configured. Delegates to NotificationsService.deliver — any throw bubbles up
 * so BullMQ records the failure and retries per the job's backoff policy.
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<SendEmailPayload>): Promise<void> {
    const payload = job.data;
    this.logger.debug(
      `[${payload.tag}] processing email job ${job.id} (attempt ${job.attemptsMade + 1})`,
    );
    await this.notifications.deliver(payload);
  }
}
