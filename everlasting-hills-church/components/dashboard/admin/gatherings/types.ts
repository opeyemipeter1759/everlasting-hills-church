import type { Gathering, GatheringInput } from "@/lib/api/gatherings";
import {
  buildRecurrenceRule,
  parseRecurrenceRule,
  type Frequency,
} from "@/lib/gatherings/recurrence";

export type GatheringFilter = "ALL" | "ACTIVE" | "INACTIVE";

/**
 * The composer's state.
 *
 * Flatter than the API shape on purpose: the RRULE is split into the two
 * controls that produce it, and nullable text fields are plain strings so the
 * inputs stay controlled. `toInput` puts both back.
 */
export interface GatheringFormValues {
  title: string;
  description: string;
  frequency: Frequency;
  byDay: string[];
  startDate: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  joinUrl: string;
  isActive: boolean;
}

/** The church's own zone. Matches the backend default so a created row round-trips unchanged. */
export const DEFAULT_TIMEZONE = "Africa/Lagos";

export function emptyForm(today = new Date()): GatheringFormValues {
  return {
    title: "",
    description: "",
    frequency: "DAILY",
    byDay: [],
    // Anchored today: a gathering created now should start now, not need a date picked.
    startDate: toDateInput(today),
    startTime: "05:30",
    durationMinutes: 60,
    timezone: DEFAULT_TIMEZONE,
    joinUrl: "",
    isActive: true,
  };
}

/** A `Date` as the YYYY-MM-DD an `<input type="date">` expects, read in local time. */
export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Opens an existing gathering in the composer. */
export function fromGathering(gathering: Gathering): GatheringFormValues {
  const pattern = parseRecurrenceRule(gathering.recurrenceRule);
  return {
    title: gathering.title,
    description: gathering.description ?? "",
    frequency: pattern.frequency,
    byDay: pattern.byDay,
    startDate: gathering.startDate,
    startTime: gathering.startTime,
    durationMinutes: gathering.durationMinutes,
    timezone: gathering.timezone,
    joinUrl: gathering.joinUrl ?? "",
    isActive: gathering.isActive,
  };
}

/**
 * Composer state → request body.
 *
 * Blank optional text becomes `null`, not `""`: the API treats an empty string
 * as a value to store, and a gathering with a join URL of "" would render an
 * empty "Join" button on the member card.
 */
export function toInput(values: GatheringFormValues): GatheringInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    recurrenceRule: buildRecurrenceRule({ frequency: values.frequency, byDay: values.byDay }),
    startDate: values.startDate,
    startTime: values.startTime,
    durationMinutes: values.durationMinutes,
    timezone: values.timezone,
    joinUrl: values.joinUrl.trim() || null,
    isActive: values.isActive,
  };
}

/**
 * Whether the form can be submitted.
 *
 * Mirrors the server's rules rather than inventing softer ones, so the button
 * is disabled instead of the request coming back 400. The one rule that is
 * only enforced here is the weekly-needs-a-day check — the API accepts a bare
 * `FREQ=WEEKLY` and falls back to the anchor date's weekday, which is correct
 * but not something an admin should have to infer from an unselected row of chips.
 */
export function validate(values: GatheringFormValues): string | null {
  if (values.title.trim().length < 3) return "Give the gathering a name of at least 3 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.startDate)) return "Pick a start date.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.startTime)) return "Pick a start time.";
  if (values.durationMinutes < 1 || values.durationMinutes > 1440) {
    return "Duration must be between 1 minute and 24 hours.";
  }
  if (values.frequency === "WEEKLY" && values.byDay.length === 0) {
    return "Choose at least one day of the week.";
  }
  if (values.joinUrl.trim() && !isHttpUrl(values.joinUrl.trim())) {
    return "The join link must be a full URL, starting with https://";
  }
  return null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
