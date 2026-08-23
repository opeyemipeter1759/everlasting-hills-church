import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class FirstTimerFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    private readonly sessionWindow: AttendanceSessionWindowService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async submitFirstTimer(data: FirstTimerDto) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone_number.trim();

    if (normalizedEmail) {
      const existing = await this.prisma.visitor.findFirst({
        where: { email: normalizedEmail, tenantId: this.tenantId },
      });
      if (existing) {
        throw new BadRequestException(`A visitor with email "${normalizedEmail}" already exists`);
      }
    }
    if (normalizedPhone) {
      const existing = await this.prisma.visitor.findFirst({
        where: { phone: normalizedPhone, tenantId: this.tenantId },
      });
      if (existing) {
        throw new BadRequestException(`A visitor with phone number "${normalizedPhone}" already exists`);
      }
    }

    // find-or-create (not a plain lookup): a first-timer registering live is a real
    // visit happening now, so it's fine to create today's Service row on demand —
    // mirrors what attendance check-in already does for the same reason.
    const todaysService = await this.sessionWindow.findOrCreateTodayService();

    const [visitor] = await Promise.all([
      this.prisma.visitor.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          firstName: data.first_name.trim(),
          lastName: data.last_name.trim(),
          phone: normalizedPhone,
          email: normalizedEmail ?? null,
          gender: data.gender ?? null,
          dateOfBirth: composeBirthdayIso(data.birth_day, data.birth_month),
          attendanceType: data.attendance_type ?? null,
          howDidYouLearn: data.how_did_you_learn ?? null,
          invitedBy: data.invited_by ?? null,
          locatedInIbadan: data.located_in_ibadan ?? null,
          membershipInterest: data.membership_interest ?? null,
          address: data.address ?? null,
          occupation: data.occupation ?? null,
          bornAgain: data.born_again ?? null,
          serviceExperience: data.service_experience ?? null,
          prayerPoint: data.prayer_point ?? null,
          whatsappInterest: data.whatsapp_interest ?? null,
          serviceId: todaysService?.id ?? null,
        },
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

    // Fire-and-forget — does not block response.
    // Admin/pastoral team: full details + review & assign-for-follow-up CTAs.
    this.emailDispatch.dispatch(
      buildFirstTimerAdminEmail({ data, adminEmail: this.emailDispatch.adminEmail, appUrl: this.emailDispatch.appUrl }),
    );
    // The guest: warm welcome with service times, address, and ways to connect.
    if (normalizedEmail) {
      this.emailDispatch.dispatch(
        buildFirstTimerWelcomeEmail({
          firstName: data.first_name.trim(),
          email: normalizedEmail,
          appUrl: this.emailDispatch.appUrl,
        }),
      );
    }

    return {
      success: true,
      message: 'First timer registration submitted successfully',
      visitor,
    };
  }
}
