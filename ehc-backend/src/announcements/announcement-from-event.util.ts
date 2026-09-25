/** Copy for an announcement raised from a published event. */
export function buildEventAnnouncementBody(event: {
  tagline: string | null;
  shortDescription: string | null;
  description: string | null;
  venueName: string | null;
  startAt: Date;
}): string {
  // Prefer what the event was written to say about itself, shortest first —
  // an announcement is a nudge toward the event page, not a copy of it.
  const summary =
    firstNonEmpty(event.tagline, event.shortDescription, truncate(event.description, 280)) ??
    'A new event has been published.';
  const when = formatEventDayLabel(event.startAt);
  const where = event.venueName?.trim();
  const details = [when, where].filter(Boolean).join(' · ');
  return details ? `${summary}\n\n${details}` : summary;
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | null {
  for (const v of values) {
    const trimmed = v?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function truncate(value: string | null, max: number): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

const TZ = 'Africa/Lagos';

/** "Thursday, 2 October 2026" in church time, not the server's. */
export function formatEventDayLabel(startAt: Date): string {
  return startAt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
}

/** "10:00 AM" — matches the free-text shape the announcement eventTime field
 * already holds for hand-written announcements. */
export function formatEventTimeOfDay(startAt: Date): string {
  return startAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
}
