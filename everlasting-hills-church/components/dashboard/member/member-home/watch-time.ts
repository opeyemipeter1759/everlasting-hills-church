/** "22:00" → minutes after midnight. */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h || 0) % 24) * 60 + (m || 0);
}

const DAY = 24 * 60;

/**
 * Where "now" sits relative to a nightly watch, in the viewer's local time.
 * A watch may cross midnight (23:00–01:00), so the end wraps into the next day.
 */
export function watchStatus(startTime: string, endTime: string, now: Date = new Date()): { live: boolean; minutesUntil: number } {
  const start = toMinutes(startTime);
  const length = (toMinutes(endTime) - start + DAY) % DAY || DAY;
  const current = now.getHours() * 60 + now.getMinutes();
  const sinceStart = (current - start + DAY) % DAY;
  if (sinceStart < length) return { live: true, minutesUntil: 0 };
  return { live: false, minutesUntil: (start - current + DAY) % DAY };
}

/** 200 → "3h 20m", 45 → "45m". */
export function formatUntil(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
