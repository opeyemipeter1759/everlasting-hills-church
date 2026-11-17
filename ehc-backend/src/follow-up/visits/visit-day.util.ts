import { BadRequestException } from '@nestjs/common';

/** Lagos is UTC+1 all year, with no daylight saving. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD": the Lagos calendar date an instant falls on. */
export function lagosDay(instant: Date): string {
  return new Date(instant.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** The day a DATE column holds. Prisma reads a DATE as UTC midnight. */
export function dayOf(column: Date): string {
  return column.toISOString().slice(0, 10);
}

/** The value a DATE column stores for a "YYYY-MM-DD" day. */
export function dateColumn(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function addDays(day: string, n: number): string {
  return new Date(dateColumn(day).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** "4 Jan 2026", for messages people read. */
export function prettyDay(day: string): string {
  return dateColumn(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** A day from a request: a real calendar date, written YYYY-MM-DD, and not after today in Lagos. */
export function parseVisitDay(raw: string, now = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new BadRequestException('Use a date written like 2026-01-04');
  const parsed = dateColumn(raw);
  if (Number.isNaN(parsed.getTime()) || dayOf(parsed) !== raw) throw new BadRequestException('That date does not exist');
  if (raw < '2000-01-01') throw new BadRequestException('That date is too far back');
  if (raw > lagosDay(now)) throw new BadRequestException('A visit cannot be in the future');
  return raw;
}
