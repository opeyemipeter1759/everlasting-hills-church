import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrayerSignupStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Env } from '../config/env.validation';
import { reportsWindowStart, summarizeReports } from './prayer-watch-report-summary';
import { nightKey } from './prayer-watch-nights';

const DAY_MS = 86_400_000;
const WAT_OFFSET_MS = 3_600_000;
const WEEKS = 12;

/** Monday of the Lagos week an instant falls in, "YYYY-MM-DD". */
export function lagosWeekStart(instant: Date): string {
  const local = new Date(instant.getTime() + WAT_OFFSET_MS);
  const day = local.getUTCDay();
  const monday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - ((day + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Everything the admin Prayer Watch overview shows, in one read. */
@Injectable()
export class PrayerWatchStatsService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async overview(now = new Date()) {
    const watch = await this.prisma.prayerWatch.findFirst({
      where: { tenantId: this.tenantId },
      orderBy: { watchDate: 'desc' },
      include: { Slots: { orderBy: { position: 'asc' }, include: { Leader: { select: { fullName: true } } } } },
    });
    if (!watch) return null;

    const slotIds = watch.Slots.map((s) => s.id);
    const [signups, familyChangesPending, reflections30d, reflectionsTotal, latestReflection, reports, firstReport] = await Promise.all([
      this.prisma.prayerSignup.findMany({
        where: { watchId: watch.id },
        select: { slotId: true, status: true, isWorker: true, createdAt: true, decidedAt: true },
      }),
      this.prisma.prayerFamilyChangeRequest.count({ where: { tenantId: this.tenantId, status: 'PENDING' } }),
      this.prisma.prayerWatchReflection.count({ where: { tenantId: this.tenantId, createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } } }),
      this.prisma.prayerWatchReflection.count({ where: { tenantId: this.tenantId } }),
      this.prisma.prayerWatchReflection.findFirst({
        where: { tenantId: this.tenantId },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true, Signup: { select: { fullName: true, Slot: { select: { label: true } } } } },
      }),
      this.prisma.prayerWatchReport.findMany({
        where: { slotId: { in: slotIds }, nightDate: { gte: reportsWindowStart(watch.Slots, now) } },
        select: { slotId: true, nightDate: true, minutesPrayed: true, peoplePresent: true, handedOver: true, handedOverTo: true, notes: true },
      }),
      this.prisma.prayerWatchReport.findFirst({ where: { slotId: { in: slotIds } }, orderBy: { nightDate: 'asc' }, select: { nightDate: true } }),
    ]);

    const confirmed = signups.filter((s) => s.status === PrayerSignupStatus.CONFIRMED);
    const pending = signups.filter((s) => s.status === PrayerSignupStatus.PENDING);
    const oldestPending = pending.reduce<Date | null>((min, s) => (!min || s.createdAt < min ? s.createdAt : min), null);

    // How long people wait for an answer, over the last 90 days of decisions.
    const recentWaits = signups
      .filter((s) => s.decidedAt && s.decidedAt.getTime() > now.getTime() - 90 * DAY_MS)
      .map((s) => (s.decidedAt!.getTime() - s.createdAt.getTime()) / 3_600_000);

    // People joining each week: when they were approved, or signed up if approval predates tracking.
    const thisWeek = lagosWeekStart(now);
    const weeks = Array.from({ length: WEEKS }, (_, i) => lagosWeekStart(new Date(new Date(`${thisWeek}T12:00:00Z`).getTime() - (WEEKS - 1 - i) * 7 * DAY_MS)));
    const joinedByWeek = new Map(weeks.map((w) => [w, 0]));
    for (const s of confirmed) {
      const week = lagosWeekStart(s.decidedAt ?? s.createdAt);
      if (joinedByWeek.has(week)) joinedByWeek.set(week, joinedByWeek.get(week)! + 1);
    }

    return {
      generatedAt: now.toISOString(),
      watchTitle: watch.title,
      telegramLinkSet: Boolean(watch.telegramLink),
      totals: {
        confirmed: confirmed.length,
        workers: confirmed.filter((s) => s.isWorker).length,
        pending: pending.length,
        declined: signups.filter((s) => s.status === PrayerSignupStatus.DECLINED).length,
        removed: signups.filter((s) => s.status === PrayerSignupStatus.REMOVED).length,
        familyChangesPending,
        reflections30d,
        reflectionsTotal,
      },
      oldestPendingAt: oldestPending?.toISOString() ?? null,
      medianWaitHours: median(recentWaits),
      slots: watch.Slots.map((slot) => {
        const mine = confirmed.filter((s) => s.slotId === slot.id);
        return {
          id: slot.id,
          label: slot.label,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          confirmed: mine.length,
          workers: mine.filter((s) => s.isWorker).length,
          pending: pending.filter((s) => s.slotId === slot.id).length,
          leaderName: slot.Leader?.fullName ?? null,
          leaderTermEndsAt: slot.leaderId ? (slot.leaderTermEndsAt?.toISOString() ?? null) : null,
          whatsappLinkSet: Boolean(slot.whatsappLink),
        };
      }),
      weekly: weeks.map((weekStart) => ({ weekStart, joined: joinedByWeek.get(weekStart) ?? 0 })),
      reports: summarizeReports(watch.Slots, reports, firstReport ? nightKey(firstReport.nightDate) : null, now),
      latestReflection: latestReflection
        ? {
            excerpt: latestReflection.body.length > 220 ? `${latestReflection.body.slice(0, 217).trimEnd()}…` : latestReflection.body,
            firstName: latestReflection.Signup.fullName.trim().split(/\s+/)[0] ?? '',
            watchLabel: latestReflection.Signup.Slot.label,
            createdAt: latestReflection.createdAt.toISOString(),
          }
        : null,
    };
  }
}
