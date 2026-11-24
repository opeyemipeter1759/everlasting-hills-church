import type { ProgramCadence, ProgramDateStatus, ProgramType } from '@prisma/client';
import { RRule } from 'rrule';
import { buildGatheringOccurrenceStart, localCalendarDate } from '../calendar/services/recurrence.util';

/**
 * When a program happens, computed on the server in the program's own
 * timezone (Africa/Lagos for EHC). The rule is read in local wall-clock time:
 * rrule walks calendar dates (held as UTC midnights, never as instants), and
 * each date becomes a real instant only through buildGatheringOccurrenceStart,
 * which applies the zone's offset. That keeps the overnight Prayer Watch and
 * the last UTC hour of every day correct, where a UTC-date walk goes wrong.
 */
export interface EditionInput {
  label: string;
  theme: string | null;
  startsOn: Date | null;
  endsOn: Date | null;
  dateStatus: ProgramDateStatus;
}
export interface SessionInput {
  name: string;
  startTime: string;
  endTime: string;
}
export interface ScheduleInput {
  cadence: ProgramCadence;
  programType: ProgramType;
  recurrenceRule: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  startOffsetDays: number;
  timezone: string;
  dateStatus: ProgramDateStatus;
  editions: EditionInput[];
  sessions: SessionInput[];
}
export interface Occurrence {
  start: Date;
  end: Date;
  /** The edition this occurrence belongs to ("Furnace '26"), if any. */
  label: string | null;
}

const DAY_MS = 86_400_000;
const HORIZON_DAYS = 400;
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** The current occurrence (if one is running now) and the next few. */
export function occurrencesFor(input: ScheduleInput, now: Date, count = 3): { current: Occurrence | null; upcoming: Occurrence[] } {
  const all = input.editions.length > 0 ? editionOccurrences(input) : input.dateStatus === 'CONFIRMED' ? ruleOccurrences(input, now) : [];
  return {
    current: all.find((o) => o.start <= now && now < o.end) ?? null,
    upcoming: all.filter((o) => o.start > now).slice(0, count),
  };
}

/** Editions override the rule: an annual program runs on its confirmed edition dates only. */
function editionOccurrences(input: ScheduleInput): Occurrence[] {
  return input.editions
    .filter((e) => e.dateStatus === 'CONFIRMED' && e.startsOn && e.endsOn)
    .map((e) => ({
      start: buildGatheringOccurrenceStart(e.startsOn!, input.startTime ?? '00:00', input.timezone),
      end: buildGatheringOccurrenceStart(addDays(e.endsOn!, 1), '00:00', input.timezone),
      label: e.label,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function ruleOccurrences(input: ScheduleInput, now: Date): Occurrence[] {
  const { recurrenceRule, startTime, durationMinutes, startOffsetDays, timezone } = input;
  if (!recurrenceRule || !startTime || !durationMinutes) return [];
  const rule = parseRule(recurrenceRule);
  if (!rule) return [];
  const durationMs = durationMinutes * 60_000;
  const today = localCalendarDate(now, timezone);
  // Reach back far enough to catch an occurrence that started days ago and is still running.
  const from = addDays(today, -(Math.ceil(durationMs / DAY_MS) + Math.abs(startOffsetDays) + 1));
  const to = addDays(today, HORIZON_DAYS + Math.abs(startOffsetDays));
  return rule.between(from, to, true).map((date) => {
    const start = buildGatheringOccurrenceStart(addDays(date, startOffsetDays), startTime, timezone);
    return { start, end: new Date(start.getTime() + durationMs), label: null };
  });
}

/** The rule anchored on a fixed local date. Presets always name their days, so the anchor never decides one. */
function parseRule(rule: string): RRule | null {
  try {
    return RRule.fromString(`DTSTART:20200101T000000Z\nRRULE:${rule.replace(/^RRULE:/, '')}`);
  } catch {
    return null;
  }
}

/** Each session of one occurrence as real instants. A session earlier in the day than the start belongs to the next morning. */
export function sessionWindows(input: ScheduleInput, occurrence: Occurrence): { name: string; start: Date; end: Date }[] {
  const baseDate = localCalendarDate(occurrence.start, input.timezone);
  const programStart = minutesOf(input.startTime ?? input.sessions[0]?.startTime ?? '00:00');
  return input.sessions.map((s) => {
    const startMin = minutesOf(s.startTime);
    const startDay = startMin < programStart ? 1 : 0;
    const endDay = minutesOf(s.endTime) <= startMin ? startDay + 1 : startDay;
    return {
      name: s.name,
      start: buildGatheringOccurrenceStart(addDays(baseDate, startDay), s.startTime, input.timezone),
      end: buildGatheringOccurrenceStart(addDays(baseDate, endDay), s.endTime, input.timezone),
    };
  });
}

// ---- words ----

const DAY_NAMES: Record<string, string> = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TYPE_WORD: Record<ProgramType, string> = {
  PRAYER: 'WATCH',
  PROPHETIC: '',
  CONSECRATION: 'CONSECRATION',
  CONFERENCE: 'CONFERENCE',
  HOLY_GHOST: 'HOLY GHOST MEETING',
  OTHER: '',
};
const CADENCE_WORD: Record<ProgramCadence, string> = { WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL', CUSTOM: '' };

function ruleParts(rule: string | null): Record<string, string> {
  if (!rule) return {};
  return Object.fromEntries(
    rule
      .replace(/^RRULE:/, '')
      .split(';')
      .map((p) => p.split('='))
      .filter((kv) => kv.length === 2)
      .map(([k, v]) => [k.toUpperCase(), v.toUpperCase()]),
  );
}

const andList = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

function clock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function endClock(startTime: string, durationMinutes: number): string {
  const total = (minutesOf(startTime) + durationMinutes) % (24 * 60);
  return clock(`${Math.floor(total / 60)}:${total % 60}`);
}

function zoneName(timezone: string): string {
  if (timezone === 'Africa/Lagos') return 'WAT';
  const part = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
  return part?.value ?? timezone;
}

/** The month a yearly program falls in: from its rule, else from its latest edition. */
function yearlyMonth(input: ScheduleInput): string | null {
  const byMonth = ruleParts(input.recurrenceRule).BYMONTH;
  if (byMonth && !byMonth.includes(',')) return MONTHS[Number(byMonth) - 1] ?? null;
  const dated = input.editions.filter((e) => e.startsOn).sort((a, b) => b.startsOn!.getTime() - a.startsOn!.getTime());
  return dated[0] ? MONTHS[dated[0].startsOn!.getUTCMonth()] : null;
}

/** "Every Monday, Tuesday, Thursday, Friday and Saturday night, 10:00 PM to 6:00 AM WAT". */
export function describeSchedule(input: ScheduleInput): string {
  const parts = ruleParts(input.recurrenceRule);
  if (input.dateStatus === 'TBA' && !input.editions.some((e) => e.dateStatus === 'CONFIRMED' && e.startsOn && e.endsOn && e.endsOn.getTime() >= Date.now())) {
    const month = input.cadence === 'ANNUAL' ? yearlyMonth(input) : null;
    return month ? `${month}. Date to be announced` : 'Date to be announced';
  }
  const { startTime, durationMinutes } = input;
  const zone = zoneName(input.timezone);
  const span = startTime && durationMinutes ? `${clock(startTime)} to ${endClock(startTime, durationMinutes)} ${zone}` : null;
  const days = durationMinutes ? Math.round(durationMinutes / 1440) : 0;

  if (parts.FREQ === 'WEEKLY' && parts.BYDAY) {
    const names = parts.BYDAY.split(',').map((d) => DAY_NAMES[d.slice(-2)]).filter(Boolean);
    const overnight = startTime && durationMinutes && minutesOf(startTime) >= 18 * 60 && minutesOf(startTime) + durationMinutes > 24 * 60;
    return `Every ${andList(names)}${overnight ? ' night' : ''}${span ? `, ${span}` : ''}`;
  }
  if (parts.FREQ === 'MONTHLY' && parts.BYMONTHDAY) {
    const where = parts.BYMONTHDAY === '-1' ? 'the last day of every month' : `day ${Number(parts.BYMONTHDAY)} of every month`;
    if (startTime && durationMinutes && durationMinutes >= 1440) return `From ${clock(startTime)} ${zone} on ${where}, for ${days} day${days === 1 ? '' : 's'}`;
    return `On ${where}${span ? `, ${span}` : ''}`;
  }
  if (parts.FREQ === 'YEARLY') {
    const month = yearlyMonth(input);
    if (month && parts.BYDAY === '-1SA' && input.startOffsetDays === -1) return `The last weekend of ${month}`;
    if (month && parts.BYMONTHDAY) return `Every year on ${Number(parts.BYMONTHDAY)} ${month}`;
    if (month) return `Every ${month}`;
  }
  if (input.cadence === 'ANNUAL') {
    const month = yearlyMonth(input);
    if (month) return `Every ${month}`;
  }
  const rule = input.recurrenceRule ? parseRule(input.recurrenceRule) : null;
  if (rule) {
    const text = rule.toText();
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}${span ? `, ${span}` : ''}`;
  }
  return 'Date to be announced';
}

/** The small line above a program's name, when the pastors have not written their own: "WEEKLY WATCH · MON TUE THU FRI SAT". */
export function eyebrowFor(input: ScheduleInput): string {
  const parts = ruleParts(input.recurrenceRule);
  const head = [CADENCE_WORD[input.cadence], TYPE_WORD[input.programType]].filter(Boolean).join(' ');
  let tail = '';
  if (input.cadence === 'WEEKLY' && parts.BYDAY) tail = parts.BYDAY.split(',').map((d) => d.slice(-2).replace(/^(..)$/, (x) => DAY_NAMES[x]?.slice(0, 3).toUpperCase() ?? x)).join(' ');
  else if (input.cadence === 'MONTHLY' && parts.BYMONTHDAY) tail = parts.BYMONTHDAY === '-1' ? 'LAST DAY OF THE MONTH' : `DAY ${Number(parts.BYMONTHDAY)}`;
  else if (input.cadence === 'ANNUAL') tail = yearlyMonth(input)?.toUpperCase() ?? '';
  return tail ? `${head} · ${tail}` : head;
}
