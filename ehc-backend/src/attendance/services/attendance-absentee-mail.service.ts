import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailDispatcher } from '../../jobs/mail-dispatcher';
import { buildAttendanceAbsenceEmail } from '../../notifications/templates/attendance-absence.email';
import { resolveNow } from '../../common/test-clock.util';
import { getDayBounds, WAT_OFFSET_MS } from '../attendance.types';
import { AttendanceAbsenceService } from './attendance-absence.service';
import type { Env } from '../../config/env.validation';

export interface AbsenteeMailResult {
  /** Why nothing was sent, when nothing was. */
  skipped?: 'NOT_A_SERVICE_DAY' | 'WINDOW_STILL_OPEN' | 'NO_SERVICE_ROW' | 'ALREADY_SENT' | 'NOBODY_CHECKED_IN' | 'SPECIAL_SERVICE';
  serviceId?: string;
  absent: number;
  emailed: number;
}

/**
 * Once a service's attendance window has closed, emails every active member
 * who was marked absent a short "we missed you" note.
 *
 * Runs as a scheduled job (attendance-absentee-emails) every half hour on
 * service days rather than at a fixed close time, and works out for itself
 * whether the window has closed — so it adapts if ATTENDANCE_*_CLOSE changes,
 * and a late or retried run still does the right thing. Each service is
 * mailed at most once: the job claims it by stamping absenteeMailSentAt in
 * the same transaction that reads the marker, before any email is built.
 *
 * Mirrors SessionsService's guard: if nobody checked in, attendance simply
 * wasn't taken that day, and mailing the whole church "we missed you" would
 * be wrong — so it waits for a later run (or never sends).
 */
@Injectable()
export class AttendanceAbsenteeMailService {
  private readonly logger = new Logger(AttendanceAbsenteeMailService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailDispatcher,
    private readonly absence: AttendanceAbsenceService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = (config.get('FRONTEND_URL', { infer: true }) ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
  }

  private parseHHMM(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  /** Today's close time (minutes after midnight WAT), or null when today is not a service day. */
  private closeMinutesFor(dayOfWeek: number): number | null {
    if (dayOfWeek === 0) return this.parseHHMM(this.config.get('ATTENDANCE_SUNDAY_CLOSE', { infer: true }));
    if (dayOfWeek === 3) return this.parseHHMM(this.config.get('ATTENDANCE_WEDNESDAY_CLOSE', { infer: true }));
    return null;
  }

  async run(): Promise<AbsenteeMailResult> {
    const now = resolveNow(this.config.get('ATTENDANCE_TEST_NOW', { infer: true }));
    const wat = new Date(now.getTime() + WAT_OFFSET_MS);
    const closeMin = this.closeMinutesFor(wat.getUTCDay());
    if (closeMin === null) return { skipped: 'NOT_A_SERVICE_DAY', absent: 0, emailed: 0 };

    // FORCE_OPEN is a testing switch that holds the window open indefinitely —
    // never treat that as "closed".
    const minutesNow = wat.getUTCHours() * 60 + wat.getUTCMinutes();
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true || minutesNow < closeMin) {
      return { skipped: 'WINDOW_STILL_OPEN', absent: 0, emailed: 0 };
    }

    const { startUtc, endUtc } = getDayBounds(now);
    const service = await this.prisma.service.findFirst({
      where: { tenantId: this.tenantId, scheduledAt: { gte: startUtc, lt: endUtc } },
      select: { id: true, name: true, serviceType: true, absenteeMailSentAt: true },
    });
    if (!service) return { skipped: 'NO_SERVICE_ROW', absent: 0, emailed: 0 };
    if (service.absenteeMailSentAt) return { skipped: 'ALREADY_SENT', serviceId: service.id, absent: 0, emailed: 0 };
    if (service.serviceType === ServiceType.SPECIAL) return { skipped: 'SPECIAL_SERVICE', serviceId: service.id, absent: 0, emailed: 0 };

    const presentCount = await this.prisma.attendanceRecord.count({
      where: { serviceId: service.id, tenantId: this.tenantId, present: true },
    });
    if (presentCount === 0) return { skipped: 'NOBODY_CHECKED_IN', serviceId: service.id, absent: 0, emailed: 0 };

    // Make sure the absent records exist (idempotent upserts) — the 90-second
    // auto-close poller normally has, but this job must not depend on it.
    await this.absence.markMissingAsAbsent(service.id);

    // Claim before sending. updateMany with the null guard means two
    // overlapping runs cannot both win: exactly one sees count === 1.
    const claim = await this.prisma.service.updateMany({
      where: { id: service.id, absenteeMailSentAt: null },
      data: { absenteeMailSentAt: new Date() },
    });
    if (claim.count === 0) return { skipped: 'ALREADY_SENT', serviceId: service.id, absent: 0, emailed: 0 };

    const absentees = await this.prisma.attendanceRecord.findMany({
      where: {
        serviceId: service.id,
        tenantId: this.tenantId,
        present: false,
        Member: { status: 'ACTIVE', email: { not: null } },
      },
      select: { Member: { select: { firstName: true, email: true } } },
    });

    const serviceLabel = service.serviceType === ServiceType.WEDNESDAY ? 'Midweek Service' : 'Sunday Service';
    let emailed = 0;
    const BATCH = 8;
    for (let i = 0; i < absentees.length; i += BATCH) {
      const batch = absentees.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async ({ Member }) => {
          if (!Member.email) return;
          try {
            await this.mail.dispatch(
              buildAttendanceAbsenceEmail({
                email: Member.email,
                firstName: Member.firstName,
                serviceLabel,
                appUrl: this.appUrl,
              }),
            );
            emailed += 1;
          } catch (err) {
            this.logger.warn(`absentee email to ${Member.email} failed: ${(err as Error).message}`);
          }
        }),
      );
      // Resend allows 10 req/s; same pacing as the other bulk senders.
      if (i + BATCH < absentees.length) await new Promise((r) => setTimeout(r, 1_100));
    }

    await this.prisma.service.update({ where: { id: service.id }, data: { absenteeMailCount: emailed } });
    this.logger.log(`attendance-absentee-emails: "${service.name}" — ${absentees.length} absent, ${emailed} emailed`);
    return { serviceId: service.id, absent: absentees.length, emailed };
  }
}
