import data from "@/data/daily-scripture.json";
import type { DailyScripture } from "@/lib/api/daily-scripture";

/**
 * Today's scripture, answered by the website itself.
 *
 * The API owns the daily scripture, but the public homepage cannot go blank
 * whenever the API is cold, down, or older than the website (on 16 Sep 2026 a
 * stale API refused scripture to every visitor for a day). So the website asks
 * the API first and otherwise answers from data/daily-scripture.json: the same
 * rotation and the same stored text, exported from the database by
 * ehc-backend/scripts/export-daily-scripture.ts. A test fails if that rotation
 * and the API's verse-of-the-day.ts ever disagree.
 *
 * Server only: imported by the /api/scripture route handlers, never by client
 * components, so the texts stay out of the browser bundle.
 */

export interface ScriptureTranslation {
  code: string;
  name: string;
  isDefault: boolean;
}

interface DailyScriptureData {
  rotationStart: string;
  timezone: string;
  translations: ScriptureTranslation[];
  verses: { ref: number[]; reference: string; text: Record<string, string> }[];
}

const DATA = data as DailyScriptureData;

export const SCRIPTURE_TIMEZONE = DATA.timezone;

/** The calendar date in Lagos as yyyy-mm-dd. The verse changes at midnight there. */
export function scriptureDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DATA.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Position in the rotation for a date; wraps before the start as well as after. */
export function rotationIndex(date: string): number {
  const days = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${DATA.rotationStart}T00:00:00Z`)) / 86_400_000,
  );
  const count = DATA.verses.length;
  return ((days % count) + count) % count;
}

export function bundledTranslations(): ScriptureTranslation[] {
  return DATA.translations.map((translation) => ({ ...translation }));
}

/** The scripture for a date from the bundled copy, or null for a version it doesn't have. */
export function bundledDailyScripture(date: string, translation?: string): DailyScripture | null {
  const fallback = DATA.translations.find((item) => item.isDefault) ?? DATA.translations[0];
  const code = translation?.trim().toUpperCase() || fallback.code;
  const version = DATA.translations.find((item) => item.code === code);
  const verse = DATA.verses[rotationIndex(date)];
  const text = verse?.text[code];
  if (!version || !text) return null;
  return {
    date,
    timezone: DATA.timezone,
    reference: verse.reference,
    text,
    translationCode: version.code,
    translationName: version.name,
  };
}

export function isDailyScripture(value: unknown): value is DailyScripture {
  const item = value as Partial<DailyScripture> | null;
  return Boolean(
    item &&
      typeof item === "object" &&
      [item.date, item.timezone, item.reference, item.text, item.translationCode, item.translationName].every(
        (field) => typeof field === "string" && field.trim().length > 0,
      ),
  );
}

export function isTranslationList(value: unknown): value is ScriptureTranslation[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.code === "string" &&
        typeof item.name === "string" &&
        typeof item.isDefault === "boolean",
    )
  );
}

/** Reads an API path and returns its data, or null when the API can't answer. */
export type ApiReader = (path: string) => Promise<unknown>;

export type Sourced<T> = { value: T; source: "api" | "bundled" };

async function safely(read: ApiReader, path: string): Promise<unknown> {
  try {
    return await read(path);
  } catch {
    return null;
  }
}

export async function resolveDailyScripture(
  read: ApiReader,
  translation?: string,
  now: Date = new Date(),
): Promise<Sourced<DailyScripture> | null> {
  const query = translation ? `?translation=${encodeURIComponent(translation)}` : "";
  const answer = await safely(read, `/bible/today${query}`);
  if (isDailyScripture(answer)) return { value: answer, source: "api" };
  const bundled = bundledDailyScripture(scriptureDate(now), translation);
  return bundled ? { value: bundled, source: "bundled" } : null;
}

export async function resolveScriptureTranslations(read: ApiReader): Promise<Sourced<ScriptureTranslation[]>> {
  const answer = await safely(read, "/bible/translations");
  if (isTranslationList(answer)) {
    return {
      value: answer.map(({ code, name, isDefault }) => ({ code, name, isDefault })),
      source: "api",
    };
  }
  return { value: bundledTranslations(), source: "bundled" };
}
