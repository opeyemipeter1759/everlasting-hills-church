import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildBirthdayEmail } from '../notifications/templates/birthday.email';
import type { Env } from '../config/env.validation';

/**
 * Recurring scheduled tasks (cron). Runs on a single instance; if you scale to
 * multiple instances, gate these behind a leader lock or move them to a
 * repeatable BullMQ job so they don't fire N times.
 *
 * All sends go through MailDispatcher, so they inherit the queue + retries when
 * Redis is configured and degrade to in-process delivery otherwise.
 */
@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailDispatcher,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Daily birthday greetings. Fires at 08:00 server time. Finds every active
   * member with an email whose date of birth lands on today (month + day) and
   * dispatches a greeting.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'birthday-greetings' })
  async sendBirthdayGreetings(): Promise<void> {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const members = await this.prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        email: { not: null },
        dateOfBirth: { not: null },
      },
      select: { firstName: true, email: true, dateOfBirth: true },
    });

    const celebrants = members.filter((m) => {
      const dob = m.dateOfBirth as Date;
      return dob.getMonth() === month && dob.getDate() === day;
    });

    if (celebrants.length === 0) {
      this.logger.debug('birthday-greetings: no birthdays today');
      return;
    }

    for (const m of celebrants) {
      await this.mail.dispatch(
        buildBirthdayEmail({ firstName: m.firstName, email: m.email as string }),
      );
    }
    this.logger.log(`birthday-greetings: dispatched ${celebrants.length} greeting(s)`);
  }

  /**
   * Daily anniversary greetings. The Member model has no anniversary date field
   * yet, so this is a wired-but-dormant placeholder: the cron and the email
   * template (buildAnniversaryEmail) are ready, and this becomes live the moment
   * a `weddingAnniversary` (or similar) column is added and selected here.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'anniversary-greetings' })
  async sendAnniversaryGreetings(): Promise<void> {
    this.logger.debug(
      'anniversary-greetings: skipped — no anniversary field on Member yet',
    );
  }

  /**
   * Weekly digest placeholder. Fires Monday 07:00. Intended to summarise the
   * week ahead (services, events, highlights) to subscribed members. Left as a
   * stub until the digest content source is decided.
   */
  @Cron(CronExpression.EVERY_WEEK, { name: 'weekly-digest' })
  async sendWeeklyDigest(): Promise<void> {
    this.logger.debug('weekly-digest: not yet implemented');
  }
}
