import { slotDateTime } from './prayer-watch.util';
import { latestNightStarted, nightDateValue, nightKey, nightWeekStart, recentWatchNights, watchMinutes } from './prayer-watch-nights';

/** Four weeks of watch nights on the hours chart; the last week in the handover chain. */
export const CHART_NIGHTS = 24;
const CHAIN_NIGHTS = 7;
/** How long after a watch ends before its missing report counts as missing. */
const GRACE_MS = 60 * 60_000;
const WEEK_MS = 7 * 86_400_000;

interface SlotShape {
  id: string;
  startTime: string;
  endTime: string;
}

export interface ReportRow {
  slotId: string;
  nightDate: Date;
  minutesPrayed: number;
  peoplePresent: number;
  handedOver: boolean;
  handedOverTo: string | null;
  notes: string | null;
}

export type WatchNightStatus = 'reported' | 'missing' | 'not-yet';

const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);

/** The oldest night the overview reads reports for. */
export function reportsWindowStart(slots: SlotShape[], now: Date): Date {
  const nights = recentWatchNights(latestNightStarted(now, slots[0]?.startTime ?? '22:00'), CHART_NIGHTS);
  return nightDateValue(nights[nights.length - 1]);
}

/**
 * Hours prayed per night and whether each watch reported and handed over.
 * Nights before the first report ever filed are left out of the counts: reports
 * didn't exist then, so nothing was missed.
 */
export function summarizeReports(slots: SlotShape[], reports: ReportRow[], firstReportNight: string | null, now: Date) {
  if (slots.length === 0) return null;
  const nights = recentWatchNights(latestNightStarted(now, slots[0].startTime), CHART_NIGHTS);
  const byKey = new Map(reports.map((r) => [`${r.slotId}|${nightKey(r.nightDate)}`, r]));

  const watchOn = (night: string, slot: SlotShape) => {
    const r = byKey.get(`${slot.id}|${night}`);
    if (r) {
      return { slotId: slot.id, status: 'reported' as WatchNightStatus, minutes: r.minutesPrayed, people: r.peoplePresent, handedOver: r.handedOver, handedOverTo: r.handedOverTo, notes: r.notes };
    }
    const due = slotDateTime(nightDateValue(night), slot.endTime).getTime() + GRACE_MS <= now.getTime();
    return { slotId: slot.id, status: (due ? 'missing' : 'not-yet') as WatchNightStatus, minutes: 0, people: 0, handedOver: false, handedOverTo: null, notes: null };
  };

  const grid = nights
    .filter((night) => firstReportNight !== null && night >= firstReportNight)
    .map((night) => ({ night, watches: slots.map((slot) => watchOn(night, slot)) }));
  const tracked = new Map(grid.map((g) => [g.night, g.watches]));

  const daily = [...nights].reverse().map((night) => {
    const watches = tracked.get(night);
    const reported = (watches ?? []).filter((w) => w.status === 'reported');
    return {
      night,
      tracked: Boolean(watches),
      minutes: sum(reported.map((w) => w.minutes)),
      people: sum(reported.map((w) => w.people)),
      reported: reported.length,
      missing: (watches ?? []).filter((w) => w.status === 'missing').length,
    };
  });

  const thisWeek = nightWeekStart(nights[0]);
  const lastWeek = nightKey(new Date(nightDateValue(thisWeek).getTime() - WEEK_MS));
  const minutesInWeek = (week: string) => sum(daily.filter((d) => nightWeekStart(d.night) === week).map((d) => d.minutes));
  const cells = grid.flatMap((g) => g.watches);
  const reported = cells.filter((c) => c.status === 'reported');

  return {
    fullNightMinutes: sum(slots.map((s) => watchMinutes(nights[0], s.startTime, s.endTime) ?? 0)),
    trackingSince: firstReportNight,
    thisWeekMinutes: minutesInWeek(thisWeek),
    lastWeekMinutes: minutesInWeek(lastWeek),
    reportsIn: reported.length,
    reportsDue: cells.filter((c) => c.status !== 'not-yet').length,
    handoversMade: reported.filter((c) => c.handedOver).length,
    averagePeople: reported.length ? Math.round((sum(reported.map((c) => c.people)) / reported.length) * 10) / 10 : null,
    daily,
    chain: grid.slice(0, CHAIN_NIGHTS),
  };
}
