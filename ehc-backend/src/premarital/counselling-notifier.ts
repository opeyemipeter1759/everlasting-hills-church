import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';
import { DailyEmailBudget } from '../message-templates/email-budget.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildCounsellingEmail,
  type CounsellingEmailEvent,
} from '../notifications/templates/counselling-update.email';
import { PrismaService } from '../prisma/prisma.service';
import { lagosLabel } from './lagos-time';

/**
 * Sends the couple's emails (to the applicant only; one partner's details are
 * never sent to the other). Each email takes one of the day's shared allowance
 * first, and is logged without its content or address. A failed email is
 * logged and never fails the change that caused it. Web push can hook in here.
 */
@Injectable()
export class CounsellingNotifier {
  private readonly logger = new Logger(CounsellingNotifier.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: DailyEmailBudget,
    private readonly mail: NotificationsService,
    config: ConfigService<Env, true>,
  ) {
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      'https://www.everlastinghills.church';
  }

  async send(
    app: {
      id: string;
      tenantId: string;
      applicantFirstName: string;
      applicantEmail: string;
    },
    event: CounsellingEmailEvent,
    at?: Date | null,
  ): Promise<'SENT' | 'SKIPPED' | 'FAILED'> {
    let logId: string | null = null;
    try {
      logId = await this.budget.claimCounselling({
        tenantId: app.tenantId,
        applicationId: app.id,
        event,
      });
      if (!logId) return 'SKIPPED';
      const payload = buildCounsellingEmail({
        firstName: app.applicantFirstName,
        email: app.applicantEmail,
        event,
        when: at ? lagosLabel(at) : null,
        appUrl: this.appUrl,
      });
      await this.mail.deliver(payload);
      await this.prisma.counsellingNotificationLog.update({
        where: { id: logId },
        data: { status: 'SENT' },
      });
      return 'SENT';
    } catch (err) {
      this.logger.warn(
        `counselling email ${event} for application ${app.id} failed: ${(err as Error).message}`,
      );
      if (logId)
        await this.prisma.counsellingNotificationLog
          .update({ where: { id: logId }, data: { status: 'FAILED' } })
          .catch(() => undefined);
      return 'FAILED';
    }
  }
}
