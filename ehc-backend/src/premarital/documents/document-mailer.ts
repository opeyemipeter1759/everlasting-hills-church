import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { DailyEmailBudget } from '../../message-templates/email-budget.service';
import type { SendEmailPayload } from '../../notifications/notification-events';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

export type MailOutcome = { status: 'SENT' | 'SKIPPED' | 'FAILED'; messageId: string | null };

/**
 * Sends one documents email inside the shared daily cap (70 a day with
 * template and counselling email). Logged without its content or address. A
 * failure is reported back, never thrown.
 */
@Injectable()
export class DocumentMailer {
  private readonly logger = new Logger(DocumentMailer.name);
  readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: DailyEmailBudget,
    private readonly mail: NotificationsService,
    config: ConfigService<Env, true>,
  ) {
    this.appUrl = ((config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  get contactUrl(): string {
    return `${this.appUrl}/contact`;
  }

  /** The couple's upload page, with the token after # so no server ever sees it. */
  linkFor(rawToken: string): string {
    return `${this.appUrl}/pre-marital-counselling/documents#t=${rawToken}`;
  }

  async send(app: { id: string; tenantId: string }, event: string, payload: SendEmailPayload): Promise<MailOutcome> {
    let logId: string | null = null;
    try {
      logId = await this.budget.claimCounselling({ tenantId: app.tenantId, applicationId: app.id, event });
      if (!logId) return { status: 'SKIPPED', messageId: null };
      const messageId = await this.mail.deliver(payload);
      await this.prisma.counsellingNotificationLog.update({ where: { id: logId }, data: { status: 'SENT' } });
      return { status: 'SENT', messageId };
    } catch (err) {
      this.logger.warn(`counselling email ${event} for application ${app.id} failed: ${(err as Error).name}`);
      if (logId)
        await this.prisma.counsellingNotificationLog
          .update({ where: { id: logId }, data: { status: 'FAILED' } })
          .catch(() => undefined);
      return { status: 'FAILED', messageId: null };
    }
  }
}
