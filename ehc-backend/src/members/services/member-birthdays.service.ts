import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

@Injectable()
export class MemberBirthdaysService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async getUpcomingBirthdays(daysAhead = 7) {
    const members = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, dateOfBirth: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        photoUrl: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return members
      .filter((m) => {
        if (!m.dateOfBirth) return false;
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );
        const diff = Math.ceil(
          (thisYear.getTime() - today.getTime()) / 86_400_000,
        );
        return diff >= 0 && diff <= daysAhead;
      })
      .map((m) => {
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );
        const daysUntil = Math.ceil(
          (thisYear.getTime() - today.getTime()) / 86_400_000,
        );
        return {
          ...m,
          dateOfBirth: (m.dateOfBirth as Date).toISOString(),
          daysUntil,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  async getTodayBirthdays() {
    return this.getUpcomingBirthdays(0);
  }

  /** Active members whose wedding anniversary (month + day) is today. Same
   * month/day match used by the anniversary-greetings cron in SchedulingService. */
  async getTodayAnniversaries() {
    const members = await this.prisma.member.findMany({
      where: { tenantId: this.tenantId, status: 'ACTIVE', weddingAnniversary: { not: null } },
      select: { id: true, firstName: true, lastName: true, weddingAnniversary: true, photoUrl: true },
    });

    const today = new Date();
    return members
      .filter((m) => {
        const date = m.weddingAnniversary as Date;
        return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
      })
      .map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        photoUrl: m.photoUrl,
        years: today.getFullYear() - (m.weddingAnniversary as Date).getFullYear(),
      }));
  }

  /** PII-light projection for public/unauthenticated consumers — no email, no raw DOB. */
  async getCommunityBirthdays(daysAhead = 7) {
    const full = await this.getUpcomingBirthdays(daysAhead);
    return full.map(({ id, firstName, lastName, photoUrl, daysUntil }) => ({
      id,
      firstName,
      lastName,
      photoUrl,
      daysUntil,
    }));
  }
}
