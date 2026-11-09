import { ServiceType } from '@prisma/client';
import { ACTIVE_MEMBER } from '../members/active-members';
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

const SERVICE_TYPE_BY_KEY: Record<string, ServiceType> = {
  sunday: ServiceType.SUNDAY,
  wednesday: ServiceType.WEDNESDAY,
};

/** Each word of the search must match a first or last name, so "Marvel Angulu" finds Marvel. */
function nameFilter(name: string): Record<string, unknown> {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const matches = (w: string) => ({
    OR: [
      { firstName: { contains: w, mode: 'insensitive' } },
      { lastName: { contains: w, mode: 'insensitive' } },
    ],
  });
  if (words.length <= 1) return matches(words[0] ?? name);
  return { AND: words.map(matches) };
}

/**
 * The where clause behind GET /attendance and its Excel export. Deactivated
 * members are always left out: deactivating someone takes them out of the
 * membership (see members/active-members.ts), so they are not on the roll.
 */
export function buildAttendanceWhere(tenantId: string, q: ListAttendanceQuery): Record<string, unknown> {
  const { name, status, serviceId, serviceKey, gender } = q;
  const scheduledFilter = buildScheduledFilter(q);
  const serviceType = serviceKey ? SERVICE_TYPE_BY_KEY[serviceKey] : undefined;
  const service = {
    ...(serviceType ? { serviceType } : {}),
    ...(Object.keys(scheduledFilter).length ? { scheduledAt: scheduledFilter } : {}),
  };
  return {
    tenantId,
    ...(serviceId ? { serviceId } : {}),
    ...(status !== undefined ? { present: status === 'PRESENT' } : {}),
    Member: {
      ...ACTIVE_MEMBER,
      ...(gender ? { gender: { equals: gender.toUpperCase(), mode: 'insensitive' } } : {}),
      ...(name?.trim() ? nameFilter(name) : {}),
    },
    ...(Object.keys(service).length ? { Service: service } : {}),
  };
}

export function buildAttendanceOrderBy(sortBy: string | undefined, sortOrder: 'ASC' | 'DESC'): Record<string, unknown>[] {
  const dir = sortOrder === 'ASC' ? 'asc' : 'desc';
  // Names break every tie, so rows keep their place from one page to the next.
  const byName = [{ Member: { firstName: 'asc' } }, { Member: { lastName: 'asc' } }, { id: 'asc' }];
  if (sortBy === 'name') return [{ Member: { firstName: dir } }, { Member: { lastName: dir } }, { id: 'asc' }];
  if (sortBy === 'status') return [{ present: dir }, ...byName];
  if (sortBy === 'markedAt') return [{ checkedInAt: dir }, ...byName];
  return [{ Service: { scheduledAt: dir } }, ...byName];
}
