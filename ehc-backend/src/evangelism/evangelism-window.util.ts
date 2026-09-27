import { FINISHED_STATUSES, type ContactStatus, type FollowUpFlag } from './evangelism.types';

export const WINDOW_DAYS = 30;
/** A contact is due for follow-up this many days after the last one logged. */
export const FOLLOW_UP_EVERY_DAYS = 3;

const DAY = 24 * 60 * 60 * 1000;

export interface WindowInput {
  contactDate: Date;
  windowEndsAt: Date;
  status: string;
  callBackAt: Date | null;
  lastActionAt: Date | null;
  reviewOutcome: string | null;
  closedAt: Date | null;
}

export interface WindowState {
  /** "Day 12 of 30": which day of the window today is, never past its end. */
  day: number;
  of: number;
  /** Still being followed up — not finished, handed over or closed. */
  open: boolean;
  flag: FollowUpFlag | null;
  /** When the next follow-up is expected (null once closed). */
  nextDueAt: string | null;
}

export function windowEnd(contactDate: Date): Date {
  return new Date(contactDate.getTime() + WINDOW_DAYS * DAY);
}

/**
 * Where a contact stands in their 30-day follow-up window.
 *
 * - REVIEW once the window has run out and nobody has closed or handed them on:
 *   it's the leader's call what happens next.
 * - OVERDUE when a promised call-back date has passed, or nothing has been
 *   logged for more than three days (counting from the contact itself).
 * - DUE on the last of those three days, or the day of a call-back.
 */
export function windowState(c: WindowInput, now: Date = new Date()): WindowState {
  const of = Math.max(1, Math.round((c.windowEndsAt.getTime() - c.contactDate.getTime()) / DAY));
  const elapsed = Math.floor((now.getTime() - c.contactDate.getTime()) / DAY) + 1;
  const day = Math.min(Math.max(elapsed, 1), of);

  const open =
    !c.closedAt &&
    c.reviewOutcome !== 'HANDED_OVER' &&
    c.reviewOutcome !== 'CLOSED' &&
    !FINISHED_STATUSES.includes(c.status as ContactStatus);
  if (!open) return { day, of, open, flag: null, nextDueAt: null };

  const last = c.lastActionAt ?? c.contactDate;
  const regularDue = new Date(last.getTime() + FOLLOW_UP_EVERY_DAYS * DAY);
  const callBack = c.status === 'CALL_BACK' ? c.callBackAt : null;
  const nextDue = callBack && callBack < regularDue ? callBack : regularDue;

  if (now >= c.windowEndsAt) return { day, of, open, flag: 'REVIEW', nextDueAt: nextDue.toISOString() };

  let flag: FollowUpFlag | null = null;
  if ((callBack && callBack < startOfDay(now)) || now > regularDue) flag = 'OVERDUE';
  else if ((callBack && sameDay(callBack, now)) || regularDue.getTime() - now.getTime() <= DAY) flag = 'DUE';
  return { day, of, open, flag, nextDueAt: nextDue.toISOString() };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
