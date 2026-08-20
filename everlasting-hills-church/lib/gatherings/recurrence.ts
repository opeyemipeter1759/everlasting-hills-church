/**
 * Translation between the RRULE the API stores and the controls an admin uses.
 *
 * Nobody should have to type `FREQ=WEEKLY;BYDAY=TU,TH` into a church admin
 * panel. The composer edits a frequency plus a set of weekday chips; these
 * functions are the only place that knows the string form, in both directions.
 *
 * The supported subset is fixed by the backend — it rejects anything it cannot
 * turn into a reminder — so there is deliberately no "advanced / raw rule"
 * escape hatch here to produce a rule the server would refuse.
 */

export type Frequency = "DAILY" | "WEEKLY";

export const WEEKDAYS = [
  { code: "SU", short: "S", label: "Sunday" },
  { code: "MO", short: "M", label: "Monday" },
  { code: "TU", short: "T", label: "Tuesday" },
  { code: "WE", short: "W", label: "Wednesday" },
  { code: "TH", short: "T", label: "Thursday" },
  { code: "FR", short: "F", label: "Friday" },
  { code: "SA", short: "S", label: "Saturday" },
] as const;

const CODES = WEEKDAYS.map((d) => d.code) as readonly string[];

export interface RecurrencePattern {
  frequency: Frequency;
  /** RFC 5545 weekday codes. Empty for DAILY, or for a WEEKLY rule that follows its anchor date. */
  byDay: string[];
}

export const DEFAULT_PATTERN: RecurrencePattern = { frequency: "DAILY", byDay: [] };

/** Serialises the composer's state into the rule the API stores. */
export function buildRecurrenceRule(pattern: RecurrencePattern): string {
  if (pattern.frequency === "DAILY") return "FREQ=DAILY";

  // Keep the codes in week order regardless of the order they were clicked, so
  // the same selection always produces the same string and an unchanged
  // schedule never looks like an edit in the audit log.
  const ordered = CODES.filter((code) => pattern.byDay.includes(code));
  return ordered.length > 0 ? `FREQ=WEEKLY;BYDAY=${ordered.join(",")}` : "FREQ=WEEKLY";
}

/**
 * Reads a stored rule back into composer state.
 *
 * Falls back to the daily default for anything unrecognised rather than
 * throwing: an old row with a rule this build cannot render should still open
 * in the editor so an admin can fix it.
 */
export function parseRecurrenceRule(rule: string): RecurrencePattern {
  const parts = Object.fromEntries(
    rule
      .split(";")
      .map((part) => part.split("="))
      .filter((part) => part.length === 2)
      .map(([key, value]) => [key.toUpperCase(), value.toUpperCase()]),
  );

  if (parts.FREQ !== "WEEKLY") return { ...DEFAULT_PATTERN };

  const byDay = (parts.BYDAY ?? "")
    .split(",")
    .filter((code) => CODES.includes(code));

  return { frequency: "WEEKLY", byDay };
}

/** "05:30" → "5:30 AM". Leaves anything unparseable alone. */
export function formatTime12h(hhmm: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return hhmm;

  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${minutes} ${suffix}`;
}

/** "60" → "1 hr", "90" → "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursLabel = `${hours} hr`;

  return rest === 0 ? hoursLabel : `${hoursLabel} ${rest} min`;
}

/**
 * A human sentence for a gathering's schedule: "Every day · 5:30 AM · 1 hr".
 *
 * `anchorDate` supplies the weekday for a weekly rule with no BYDAY, which is
 * what "no BYDAY means the same weekday as DTSTART" resolves to.
 */
export function describeSchedule(
  rule: string,
  startTime: string,
  durationMinutes: number,
  anchorDate?: string,
): string {
  const pattern = parseRecurrenceRule(rule);
  const time = formatTime12h(startTime);
  const duration = formatDuration(durationMinutes);

  if (pattern.frequency === "DAILY") return `Every day · ${time} · ${duration}`;

  const codes = pattern.byDay.length > 0 ? pattern.byDay : anchorWeekdayCodes(anchorDate);
  if (codes.length === 0) return `Weekly · ${time} · ${duration}`;

  return `${describeDays(codes)} · ${time} · ${duration}`;
}

/** "Every Tuesday and Thursday", or "Every weekday" / "Every weekend" where that reads better. */
export function describeDays(codes: string[]): string {
  const ordered = CODES.filter((code) => codes.includes(code));
  if (ordered.length === 7) return "Every day";
  if (ordered.length === 5 && !ordered.includes("SU") && !ordered.includes("SA")) {
    return "Every weekday";
  }
  if (ordered.length === 2 && ordered.includes("SU") && ordered.includes("SA")) {
    return "Every weekend";
  }

  const names = ordered.map(
    (code) => `${WEEKDAYS.find((day) => day.code === code)?.label ?? code}s`,
  );
  if (names.length === 1) return `Every ${names[0].slice(0, -1)}`;

  const last = names.pop() as string;
  return `Every ${names.join(", ")} and ${last}`;
}

function anchorWeekdayCodes(anchorDate?: string): string[] {
  if (!anchorDate) return [];
  const parsed = new Date(`${anchorDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return [];
  return [CODES[parsed.getUTCDay()]];
}
