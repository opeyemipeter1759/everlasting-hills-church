import { ServiceType } from '@prisma/client';
import { WAT_OFFSET_MS, getDayBounds } from '../attendance/attendance.types';

/**
 * Deadlines from the Administration Manual, in Lagos time:
 * - Sunday: workers arrive 7:30, every department ready by 7:45.
 * - Wednesday: every department ready by 5:00 pm; service at 5:30 pm.
 * Each department's plan (Stage 1) is due 24 hours before its ready-by time.
 */
export const READY_BY: Record<'SUNDAY' | 'WEDNESDAY', { hour: number; minute: number }> = {
  SUNDAY: { hour: 7, minute: 45 },
  WEDNESDAY: { hour: 17, minute: 0 },
};
export const PLAN_LEAD_HOURS = 24;

/**
 * When each service starts, for its two inspections: the day before (same time)
 * and 2 hours before. Sunday counts from the 8:00 am workers' service.
 */
export const SERVICE_START: Record<'SUNDAY' | 'WEDNESDAY', { hour: number; minute: number }> = {
  SUNDAY: { hour: 8, minute: 0 },
  WEDNESDAY: { hour: 17, minute: 30 },
};
export const INSPECTION_ROUNDS = ['DAY_BEFORE', 'ON_THE_DAY'] as const;
export type InspectionRoundKey = (typeof INSPECTION_ROUNDS)[number];

/** The kinds of service the readiness cycle runs on. Special programs are planned separately. */
export type ReadinessServiceType = keyof typeof READY_BY;

export function isReadinessType(type: ServiceType): type is ReadinessServiceType {
  return type === ServiceType.SUNDAY || type === ServiceType.WEDNESDAY;
}

export interface ReadinessTimes {
  readyBy: Date;
  planDue: Date;
  startsAt: Date;
  inspections: Record<InspectionRoundKey, Date>;
}

/** Every deadline for a service held on the Lagos day containing `scheduledAt`. */
export function readinessTimes(type: ServiceType, scheduledAt: Date): ReadinessTimes | null {
  if (!isReadinessType(type)) return null;
  const dayStart = getDayBounds(scheduledAt).startUtc.getTime();
  const at = ({ hour, minute }: { hour: number; minute: number }) => new Date(dayStart + (hour * 60 + minute) * 60_000);
  const readyBy = at(READY_BY[type]);
  const startsAt = at(SERVICE_START[type]);
  return {
    readyBy,
    planDue: new Date(readyBy.getTime() - PLAN_LEAD_HOURS * 3_600_000),
    startsAt,
    inspections: {
      DAY_BEFORE: new Date(startsAt.getTime() - 24 * 3_600_000),
      ON_THE_DAY: new Date(startsAt.getTime() - 2 * 3_600_000),
    },
  };
}

/** Lagos weekday (0 = Sunday) of the day containing `at`. */
function watWeekday(at: Date): number {
  return new Date(at.getTime() + WAT_OFFSET_MS).getUTCDay();
}

/**
 * Sunday and Wednesday service days from today through the next `days` days,
 * as the UTC instant their Lagos day starts — the same `scheduledAt` the
 * attendance flow gives the services it creates on the day.
 */
export function upcomingServiceDays(now: Date, days = 8): { dayStart: Date; type: ReadinessServiceType }[] {
  const out: { dayStart: Date; type: ReadinessServiceType }[] = [];
  const today = getDayBounds(now).startUtc.getTime();
  for (let i = 0; i <= days; i++) {
    const dayStart = new Date(today + i * 86_400_000);
    const dow = watWeekday(dayStart);
    if (dow === 0) out.push({ dayStart, type: 'SUNDAY' });
    if (dow === 3) out.push({ dayStart, type: 'WEDNESDAY' });
  }
  return out;
}

/** "Sunday Service — Sunday, 15 November 2026": the name attendance gives a service it creates. */
export function serviceName(type: ReadinessServiceType, dayStart: Date): string {
  const watDate = new Date(dayStart.getTime() + WAT_OFFSET_MS);
  const label = watDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `${type === 'SUNDAY' ? 'Sunday Service' : 'Midweek Service'} — ${label}`;
}
