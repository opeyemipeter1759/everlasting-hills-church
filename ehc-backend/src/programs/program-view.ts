import type { Program, ProgramEdition, ProgramScripture, ProgramSession } from '@prisma/client';
import { describeSchedule, eyebrowFor, occurrencesFor, sessionWindows, type Occurrence, type ScheduleInput } from './program-occurrences';
import type { ResolvedScripture } from './program-scripture';

export type ProgramWithParts = Program & { Scriptures: ProgramScripture[]; Sessions: ProgramSession[]; Editions: ProgramEdition[] };

export function scheduleOf(p: ProgramWithParts): ScheduleInput {
  return {
    cadence: p.cadence,
    programType: p.programType,
    recurrenceRule: p.recurrenceRule,
    startTime: p.startTime,
    durationMinutes: p.durationMinutes,
    startOffsetDays: p.startOffsetDays,
    timezone: p.timezone,
    dateStatus: p.dateStatus,
    editions: p.Editions.map((e) => ({ label: e.label, theme: e.theme, startsOn: e.startsOn, endsOn: e.endsOn, dateStatus: e.dateStatus })),
    sessions: p.Sessions.map((s) => ({ name: s.name, startTime: s.startTime, endTime: s.endTime })),
  };
}

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

function window(input: ScheduleInput, o: Occurrence) {
  return {
    start: o.start.toISOString(),
    end: o.end.toISOString(),
    label: o.label,
    sessions: sessionWindows(input, o).map((s) => ({ name: s.name, start: s.start.toISOString(), end: s.end.toISOString() })),
  };
}

/**
 * What the public site shows on a card. Occurrence and session windows are
 * sent as instants so the page can keep "live" and "on now" right between
 * revalidations without ever working out a date itself.
 */
export function cardView(p: ProgramWithParts, scriptures: ResolvedScripture[], now: Date) {
  const input = scheduleOf(p);
  const { current, upcoming } = occurrencesFor(input, now);
  const live = current ? sessionWindows(input, current).find((s) => s.start <= now && now < s.end) : undefined;
  const next = current ?? upcoming[0] ?? null;
  return {
    slug: p.slug,
    name: p.name,
    nameStatus: p.nameStatus,
    eyebrow: p.eyebrow?.trim() || eyebrowFor(input),
    shortDescription: p.shortDescription,
    programType: p.programType,
    cadence: p.cadence,
    format: p.format,
    accent: p.accent,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    ctaLabel: p.ctaLabel,
    ctaUrl: p.ctaUrl,
    featured: p.featured,
    dateStatus: p.dateStatus,
    schedule: describeSchedule(input),
    nextOccurrence: next ? { start: next.start.toISOString(), end: next.end.toISOString(), label: next.label } : null,
    isLiveNow: !!current,
    liveSession: live?.name ?? null,
    occurrences: [...(current ? [current] : []), ...upcoming].map((o) => window(input, o)),
    scriptures: p.Scriptures.map((s, i) => ({ ...scriptures[i], status: s.scriptureStatus })),
  };
}

/** The full program page: everything on the card, plus the story, the watches and the editions. */
export function detailView(p: ProgramWithParts, scriptures: ResolvedScripture[], now: Date, today: Date) {
  const editions = [...p.Editions]
    .sort((a, b) => (a.startsOn?.getTime() ?? Infinity) - (b.startsOn?.getTime() ?? Infinity))
    .map((e) => ({ label: e.label, theme: e.theme, startsOn: day(e.startsOn), endsOn: day(e.endsOn), dateStatus: e.dateStatus, summary: e.summary, recordingUrl: e.recordingUrl }));
  const isPast = (e: (typeof editions)[number]) => e.dateStatus === 'CONFIRMED' && !!e.endsOn && e.endsOn < day(today)!;
  return {
    ...cardView(p, scriptures, now),
    longDescription: p.longDescription,
    venue: p.venue,
    streamUrl: p.streamUrl,
    timezone: p.timezone,
    sessions: p.Sessions.map((s) => ({ name: s.name, startTime: s.startTime, endTime: s.endTime, description: s.description })),
    editions: { upcoming: editions.filter((e) => !isPast(e)), archive: editions.filter(isPast).reverse() },
  };
}
