import { getBackendBaseUrl } from "@/lib/api/backend-url";

export type ProgramAccent = "BURGUNDY" | "CRIMSON" | "DEEP_BURGUNDY" | "GOLD";
export type ProgramCadence = "WEEKLY" | "MONTHLY" | "ANNUAL" | "CUSTOM";
export type ProgramType = "PRAYER" | "PROPHETIC" | "CONSECRATION" | "CONFERENCE" | "HOLY_GHOST" | "OTHER";

export interface Window {
  start: string;
  end: string;
  label: string | null;
}
export interface Occurrence extends Window {
  sessions: { name: string; start: string; end: string }[];
}
export interface Scripture {
  reference: string;
  text: string | null;
  translation: string | null;
  status: "CONFIRMED" | "SUGGESTED";
}

/** One program as the public API sends it. Dates are instants; the page never works one out itself. */
export interface ProgramCard {
  slug: string;
  name: string;
  nameStatus: "FINAL" | "PROVISIONAL";
  eyebrow: string;
  shortDescription: string;
  programType: ProgramType;
  cadence: ProgramCadence;
  format: "IN_PERSON" | "ONLINE" | "HYBRID";
  accent: ProgramAccent;
  logoUrl: string | null;
  coverUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  featured: boolean;
  dateStatus: "CONFIRMED" | "TBA";
  schedule: string;
  nextOccurrence: Window | null;
  isLiveNow: boolean;
  liveSession: string | null;
  occurrences: Occurrence[];
  scriptures: Scripture[];
}

export interface Edition {
  label: string;
  theme: string | null;
  startsOn: string | null;
  endsOn: string | null;
  dateStatus: "CONFIRMED" | "TBA";
  summary: string | null;
  recordingUrl: string | null;
}

export interface ProgramDetail extends ProgramCard {
  longDescription: string | null;
  venue: string | null;
  streamUrl: string | null;
  timezone: string;
  sessions: { name: string; startTime: string; endTime: string; description: string | null }[];
  editions: { upcoming: Edition[]; archive: Edition[] };
}

/** Server fetches share one tag; every write in the dashboard revalidates it. */
const CACHE: RequestInit = { next: { revalidate: 300, tags: ["programs"] } };

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${getBackendBaseUrl()}${path}`, CACHE);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Programs request failed (${res.status})`);
  const body = (await res.json()) as { data?: T };
  return body.data ?? null;
}

/** Server only. Throws when the API cannot be reached, so the page shows its error state instead of an empty list. */
export async function getPrograms(): Promise<ProgramCard[]> {
  return (await get<ProgramCard[]>("/public/programs")) ?? [];
}

export function getProgram(slug: string): Promise<ProgramDetail | null> {
  return get<ProgramDetail>(`/public/programs/${encodeURIComponent(slug)}`);
}

/** The quiet anchor under the hero (Genesis 49:26), read from the church's Bible tables. */
export async function getAnchor(): Promise<Scripture | null> {
  try {
    return await get<Scripture>("/public/programs/anchor");
  } catch {
    return null;
  }
}

/** The .ics download, through the site's own API proxy. */
export const calendarHref = (slug: string) => `/api/backend/public/programs/${encodeURIComponent(slug)}/calendar.ics`;
