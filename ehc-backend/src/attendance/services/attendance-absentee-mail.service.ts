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
  skipped?: 'NO_SERVICE_DUE' | 'WINDOW_STILL_OPEN' | 'ALREADY_SENT' | 'NOBODY_CHECKED_IN';
  serviceId?: string;
  absent: number;
  emailed: number;
}

/**
 * How far back a service can still be mailed. Long enough that a late close
 * (e.g. Wednesday held open to 23:59) or a missed run is caught the next day;
 * short enough that a service from last week is never mailed out of the blue.
 */
const CATCH_UP_MS = 48 * 60 * 60 * 1000;

/**
 * Once a service's attendance window has closed, emails every active member
 * who was marked absent a short "we missed you" note.
 *
 * Runs as a scheduled job (attendance-absentee-emails) every half hour, every
 * day, and works out for itself which service is due: the most recent Sunday
 * or Wednesday service from the last 48 hours whose window has closed and
 * that hasn't been mailed yet. It deliberately does not look only at *today*:
 * that version skipped a Wednesday held open to 23:59 — the last run of the
 * day was 23:30, and by the next run it was Thursday and the service was
 * forgotten. Each service is mailed at most once: the job claims it by
 * stamping absenteeMailSentAt with a guarded update before any email is built.
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

  async run(): Promise<AbsenteeMailResult> {
    // FORCE_OPEN is a testing switch that holds the window open indefinitely —
    // never treat that as "closed".
    if (this.config.get('ATTENDANCE_FORCE_OPEN', { infer: true }) === true) {
      return { skipped: 'WINDOW_STILL_OPEN', absent: 0, emailed: 0 };
    }

    const now = resolveNow(this.config.get('ATTENDANCE_TEST_NOW', { infer: true }));
    const candidates = await this.prisma.service.findMany({
      where: {
        tenantId: this.tenantId,
        serviceType: { in: [ServiceType.SUNDAY, ServiceType.WEDNESDAY] },
        absenteeMailSentAt: null,
        scheduledAt: { gte: new Date(now.getTime() - CATCH_UP_MS), lte: now },
      },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, name: true, serviceType: true, scheduledAt: true },
    });
    if (candidates.length === 0) return { skipped: 'NO_SERVICE_DUE', absent: 0, emailed: 0 };

    // Newest first; a service still open blocks nothing older behind it.
    let stillOpen = false;
    let noCheckIns: string | undefined;
    for (const service of candidates) {
      if (now.getTime() < this.closesAt(service.scheduledAt)) {
        stillOpen = true;
        continue;
      }
      const presentCount = await this.prisma.attendanceRecord.count({
        where: { serviceId: service.id, tenantId: this.tenantId, present: true },
      });
      if (presentCount === 0) {
        // Attendance wasn't taken — mailing the whole church would be wrong.
        noCheckIns ??= service.id;
        continue;
      }
      return this.mailAbsentees(service);
    }

    return stillOpen
      ? { skipped: 'WINDOW_STILL_OPEN', absent: 0, emailed: 0 }
      : { skipped: 'NOBODY_CHECKED_IN', serviceId: noCheckIns, absent: 0, emailed: 0 };
  }

  /** When a service's check-in window closes: its day in WAT plus that weekday's close time. */
  private closesAt(scheduledAt: Date): number {
    const day = new Date(scheduledAt.getTime() + WAT_OFFSET_MS).getUTCDay();
    const closeMin = day === 0 ? this.closeMinutes('ATTENDANCE_SUNDAY_CLOSE') : this.closeMinutes('ATTENDANCE_WEDNESDAY_CLOSE');
    return getDayBounds(scheduledAt).startUtc.getTime() + closeMin * 60_000;
  }

  private closeMinutes(key: 'ATTENDANCE_SUNDAY_CLOSE' | 'ATTENDANCE_WEDNESDAY_CLOSE'): number {
    const [h, m] = this.config.get(key, { infer: true }).split(':').map(Number);
    return h * 60 + m;
  }

  private async mailAbsentees(service: { id: string; name: string; serviceType: ServiceType }): Promise<AbsenteeMailResult> {
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
