import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { AttendanceSessionWindowService } from '../../attendance/services/attendance-session-window.service';
import { FirstTimerDto } from '../dto/first-timer.dto';
import { buildFirstTimerWelcomeEmail } from '../../notifications/templates/first-timer-welcome.email';
import { buildFirstTimerAdminEmail } from '../../notifications/templates/first-timer-admin.email';
import { composeBirthdayIso } from '../birthday.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';
import { VisitorEvents, type VisitorCreatedPayload } from '../../notifications/notification-events';
import { normalizeNigerianPhone } from '../../common/phone.util';
import { heardFromProblems } from '../first-timer-heard-from.schema';
import { findPossibleReturn, lagosDay } from './first-timer-return';
import { weekdayOf, welcomeLinks } from '../../notifications/church-links';

@Injectable()
export class FirstTimerFormService {
  private readonly logger = new Logger(FirstTimerFormService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    private readonly sessionWindow: AttendanceSessionWindowService,
    private readonly events: EventEmitter2,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async submitFirstTimer(data: FirstTimerDto) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = normalizeNigerianPhone(data.phone_number) ?? data.phone_number.trim();

    const problems = heardFromProblems({
      howDidYouLearn: data.how_did_you_learn,
      invitedBy: data.invited_by,
      heardFromOther: data.heard_from_other,
    });
    if (problems.length) throw new BadRequestException(problems.join('. '));

    // A phone or email the church already has is a possible return visit, not
    // an error: the form goes in, flagged for staff to confirm. Families share
    // phones, so nothing is merged.
    const possibleReturn = await findPossibleReturn(this.prisma, this.tenantId, normalizedPhone, normalizedEmail ?? null);

    // find-or-create (not a plain lookup): a first-timer registering live is a real
    // visit happening now, so it's fine to create today's Service row on demand —
    // mirrors what attendance check-in already does for the same reason.
    const todaysService = await this.sessionWindow.findOrCreateTodayService();
    // Their first visit is the day of the service they came to, in Lagos time.
    const firstVisitDate = lagosDay(todaysService?.scheduledAt ?? new Date());
    const visitorId = randomUUID();

    const [visitor] = await this.prisma.$transaction([
      this.prisma.visitor.create({
        data: {
          id: visitorId,
          tenantId: this.tenantId,
          firstName: data.first_name.trim(),
          lastName: data.last_name.trim(),
          phone: normalizedPhone,
          email: normalizedEmail ?? null,
          gender: data.gender ?? null,
          dateOfBirth: composeBirthdayIso(data.birth_day, data.birth_month),
          attendanceType: data.attendance_type ?? null,
          howDidYouLearn: data.how_did_you_learn ?? null,
          invitedBy: data.invited_by?.trim() || null,
          heardFromOther: data.heard_from_other?.trim() || null,
          isStudent: data.is_student ?? null,
          firstVisitDate,
          possibleReturnVisitorId: possibleReturn.visitorId,
          possibleReturnMemberId: possibleReturn.memberId,
          locatedInIbadan: data.located_in_ibadan ?? null,
          membershipInterest: data.membership_interest ?? null,
          address: data.address ?? null,
          occupation: data.occupation ?? null,
          bornAgain: data.born_again ?? null,
          serviceExperience: data.service_experience ?? null,
          prayerPoint: data.prayer_point ?? null,
          whatsappInterest: data.whatsapp_interest ?? null,
          shareForConnections: data.share_for_connections ?? false,
          serviceId: todaysService?.id ?? null,
        },
      }),
      this.prisma.firstTimerVisit.create({
        data: { id: randomUUID(), tenantId: this.tenantId, visitorId, visitedOn: firstVisitDate, source: 'FORM' },
      }),
      this.prisma.formSubmission.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          type: 'first_timer',
          data: data as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    // Put them in the Follow-Up pipeline and route them now, inside the request:
    // Cloud Run throttles the CPU once the response is sent. The form is already
    // saved, so a failure here is logged and the daily sweep picks them up.
    await this.events
      .emitAsync(VisitorEvents.Created, { visitorIds: [visitor.id] } satisfies VisitorCreatedPayload)
      .catch((err: unknown) => this.logger.warn(`Routing a new first-timer failed: ${(err as Error).message}`));

    // Fire-and-forget — does not block response.
    // Admin/pastoral team: full details + review & assign-for-follow-up CTAs.
    this.emailDispatch.dispatch(
      buildFirstTimerAdminEmail({ data, adminEmail: this.emailDispatch.adminEmail, appUrl: this.emailDispatch.appUrl }),
    );
    // The guest: warm welcome with service times, address, and ways to connect:
    // the day they came, and the website and the accounts the website shows.
    if (normalizedEmail) {
      const appUrl = this.emailDispatch.appUrl;
      const links = await welcomeLinks(this.prisma, this.tenantId, appUrl);
      this.emailDispatch.dispatch(
        buildFirstTimerWelcomeEmail({ firstName: data.first_name.trim(), email: normalizedEmail, appUrl, firstVisitDay: weekdayOf(firstVisitDate), links }),
      );
    }

    return {
      success: true,
      message: 'First timer registration submitted successfully',
      visitor,
    };
  }
}
