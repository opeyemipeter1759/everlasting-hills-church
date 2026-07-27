import { WAT_OFFSET_MS } from './attendance.types';
import type { ListAttendanceQuery } from './attendance.types';

export function svcKey(d: Date): string {
  const day = new Date(d.getTime() + WAT_OFFSET_MS).getUTCDay();
  return day === 0 ? 'sunday' : day === 3 ? 'wednesday' : 'other';
}

export function watDateStr(d: Date): string {
  return new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Parse a "yyyy-MM-dd" string as WAT midnight (UTC+1). */
function watMidnight(iso: string): Date {
  return new Date(new Date(iso).getTime() - WAT_OFFSET_MS);
}

export function buildScheduledFilter(q: ListAttendanceQuery): Record<string, Date> {
  const { date, month, year, dateFrom, dateTo } = q;
  const scheduledFilter: Record<string, Date> = {};
  if (date) {
    const start = watMidnight(date);
    scheduledFilter.gte = start;
    scheduledFilter.lt = new Date(start.getTime() + 86_400_000);
  } else if (month) {
    const [y, m] = month.split('-').map(Number);
    scheduledFilter.gte = new Date(y, m - 1, 1);
    scheduledFilter.lt = new Date(y, m, 1);
  } else if (year) {
    scheduledFilter.gte = new Date(Number(year), 0, 1);
    scheduledFilter.lt = new Date(Number(year) + 1, 0, 1);
  } else {
    if (dateFrom) scheduledFilter.gte = watMidnight(dateFrom);
    if (dateTo) scheduledFilter.lt = new Date(watMidnight(dateTo).getTime() + 86_400_000);
  }
  return scheduledFilter;
}

export function buildAttendanceWhere(tenantId: string, q: ListAttendanceQuery): Record<string, unknown> {
  const { name, status } = q;
  const scheduledFilter = buildScheduledFilter(q);
  return {
    tenantId,
    ...(status !== undefined ? { present: status === 'PRESENT' } : {}),
    ...(name
      ? {
          Member: {
            OR: [
              { firstName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
    ...(Object.keys(scheduledFilter).length ? { Service: { scheduledAt: scheduledFilter } } : {}),
  };
}

export function buildAttendanceOrderBy(sortBy: string | undefined, sortOrder: 'ASC' | 'DESC'): Record<string, unknown> {
  const dir = sortOrder === 'ASC' ? 'asc' : 'desc';
  if (sortBy === 'name') return { Member: { firstName: dir } };
  if (sortBy === 'status') return { present: dir };
  if (sortBy === 'markedAt') return { checkedInAt: dir };
  return { Service: { scheduledAt: dir } };
}
