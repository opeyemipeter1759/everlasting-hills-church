export const WAT_MS = 60 * 60 * 1000; // WAT = UTC+1

export type Period = 'today' | 'week' | 'month' | 'year';

export interface QueryFilter {
  period?: Period;
  dateFrom?: string;   // "yyyy-MM-dd"  custom range start
  dateTo?: string;     // "yyyy-MM-dd"  custom range end (inclusive)
  serviceType?: string; // "all" | "sunday" | "wednesday" | "special"
}

export interface PeriodRange {
  start: Date; end: Date; prevStart: Date; prevEnd: Date;
}

export function periodBounds(period: Period): PeriodRange {
  const w = new Date(Date.now() + WAT_MS);
  const y = w.getUTCFullYear(), mo = w.getUTCMonth(), d = w.getUTCDate();
  const mid = (yr: number, month: number, day: number) =>
    new Date(Date.UTC(yr, month, day) - WAT_MS);

  switch (period) {
    case 'today': {
      const s = mid(y, mo, d);
      return { start: s, end: new Date(s.getTime() + 86_400_000), prevStart: new Date(s.getTime() - 86_400_000), prevEnd: s };
    }
    case 'week': {
      const e = new Date(mid(y, mo, d).getTime() + 86_400_000);
      const s = new Date(e.getTime() - 7 * 86_400_000);
      return { start: s, end: e, prevStart: new Date(s.getTime() - 7 * 86_400_000), prevEnd: s };
    }
    case 'month': {
      const s = mid(y, mo, 1), e = mid(y, mo + 1, 1);
      return { start: s, end: e, prevStart: mid(y, mo - 1, 1), prevEnd: s };
    }
    default: { // year
      const s = mid(y, 0, 1), e = mid(y + 1, 0, 1);
      return { start: s, end: e, prevStart: mid(y - 1, 0, 1), prevEnd: s };
    }
  }
}

/** Resolve a QueryFilter to an absolute date range, supporting custom dateFrom/dateTo */
export function resolveRange(q: QueryFilter): PeriodRange {
  if (q.dateFrom && q.dateTo) {
    const start = new Date(new Date(q.dateFrom).getTime() - WAT_MS);
    const end   = new Date(new Date(q.dateTo).getTime() - WAT_MS + 86_400_000);
    const duration = end.getTime() - start.getTime();
    return { start, end, prevStart: new Date(start.getTime() - duration), prevEnd: start };
  }
  return periodBounds(q.period ?? 'week');
}

/** Returns WAT date string "yyyy-MM-dd" for a UTC Date */
export function watStr(d: Date): string {
  return new Date(d.getTime() + WAT_MS).toISOString().slice(0, 10);
}

/** ServiceType enum → "sunday" | "wednesday" | "special" */
export function svcKey(type: string): string { return type.toLowerCase(); }

/** Build Prisma serviceType filter — returns {} if "all" or unset */
export function svcTypeWhere(serviceType?: string): { serviceType?: 'SUNDAY' | 'WEDNESDAY' | 'SPECIAL' } {
  const up = serviceType?.toUpperCase();
  if (up === 'SUNDAY' || up === 'WEDNESDAY' || up === 'SPECIAL') return { serviceType: up };
  return {};
}

/** Parse "2026-05" into a month period range */
export function monthBounds(ym: string): { start: Date; end: Date } {
  const [y, m] = ym.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1) - WAT_MS), end: new Date(Date.UTC(y, m, 1) - WAT_MS) };
}
