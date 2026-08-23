import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';

// Mirrors ehc-backend/src/attendance/attendance.types.ts's WAT (UTC+1) handling —
// inlined here rather than importing across modules for one line of date math.
// dateOfBirth/weddingAnniversary are stored at UTC midnight (see birthday.util.ts's
// composeBirthdayIso), so month/day must be read with UTC getters too; mixing UTC
// storage with local-timezone getters would silently shift the compared day
// depending on the host process's timezone.
const WAT_OFFSET_MS = 60 * 60 * 1000;

function todayWat(): { year: number; month: number; date: number } {
  const nowWat = new Date(Date.now() + WAT_OFFSET_MS);
  return { year: nowWat.getUTCFullYear(), month: nowWat.getUTCMonth(), date: nowWat.getUTCDate() };
}

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

    const { year, month, date } = todayWat();
    const today = new Date(Date.UTC(year, month, date));

    return members
      .filter((m) => {
        if (!m.dateOfBirth) return false;
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(Date.UTC(year, dob.getUTCMonth(), dob.getUTCDate()));
        const diff = Math.round(
          (thisYear.getTime() - today.getTime()) / 86_400_000,
        );
        return diff >= 0 && diff <= daysAhead;
      })
      .map((m) => {
        const dob = new Date(m.dateOfBirth as any);
        const thisYear = new Date(Date.UTC(year, dob.getUTCMonth(), dob.getUTCDate()));
        const daysUntil = Math.round(
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

    const { year, month, date } = todayWat();
    return members
      .filter((m) => {
        const anniversary = m.weddingAnniversary as Date;
        return anniversary.getUTCMonth() === month && anniversary.getUTCDate() === date;
      })
      .map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        photoUrl: m.photoUrl,
        years: year - (m.weddingAnniversary as Date).getUTCFullYear(),
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
