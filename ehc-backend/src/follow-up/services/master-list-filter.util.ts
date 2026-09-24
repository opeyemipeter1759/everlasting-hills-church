import type { MasterListRow } from './master-list.util';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Which half of the work a list is for.
 *
 * Follow Up meets the people who have just arrived and walks them in; once
 * somebody is integrated they leave that list, because chasing them is no
 * longer the job. The Integration Team picks them up from there and watches
 * for the ones who stop coming. ALL is for anywhere both are wanted at once.
 */
export type MasterListScope = 'FOLLOW_UP' | 'INTEGRATION' | 'ALL';

export function inScope(status: string, scope: MasterListScope = 'ALL'): boolean {
  if (scope === 'FOLLOW_UP') return status !== 'INTEGRATED';
  if (scope === 'INTEGRATION') return status === 'INTEGRATED' || status === 'AWAY';
  return true;
}

export interface MasterListFilters {
  search?: string;
  /** One of the Master List statuses. */
  status?: string;
  /** Joined, or first came, on or after this day. */
  from?: string;
  /** …and on or before this one. */
  to?: string;
  /** Only the people this member is following up. */
  assigneeId?: string;
  /** Whose list this is: Follow Up's, the Integration Team's, or both. */
  scope?: MasterListScope;
  /** A service id: only the members who missed that service. */
  absentFrom?: string;
  take: number;
  skip: number;
}

/** Whether the day this person came to the church's notice sits in the range. */
export function withinDates(row: { since: string }, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const at = new Date(row.since).getTime();
  if (Number.isNaN(at)) return true;
  if (from && at < new Date(from).getTime()) return false;
  // "to" names a day, so the whole of that day counts.
  if (to && at > new Date(to).getTime() + DAY_MS - 1) return false;
  return true;
}

export function matchesFilters(row: MasterListRow, filters: MasterListFilters): boolean {
  if (!inScope(row.status, filters.scope)) return false;
  if (filters.status && row.status !== filters.status) return false;
  if (filters.assigneeId) {
    // "unassigned" is a real thing to ask for, not the absence of a filter.
    const wanted = filters.assigneeId === 'none' ? null : filters.assigneeId;
    if ((row.assignedTo?.id ?? null) !== wanted) return false;
  }
  return withinDates(row, filters.from, filters.to);
}

/** Who checked in for one service, and the end of that service's day. */
export interface ServiceAttendance {
  presentIds: Set<string>;
  dayEndMs: number;
}

/**
 * Whether this person missed the service: a member with no check-in for it
 * who had already joined by that day. First-timers without an account have
 * no attendance of their own to miss.
 */
export function missedService(row: MasterListRow, attendance: ServiceAttendance): boolean {
  if (row.kind !== 'MEMBER' || attendance.presentIds.has(row.id)) return false;
  const since = new Date(row.since).getTime();
  return Number.isNaN(since) || since < attendance.dayEndMs;
}
