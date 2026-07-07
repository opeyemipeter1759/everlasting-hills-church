export const TZ = "Africa/Lagos";

// Many events are created without an explicit end time (it's optional in the
// admin form). Fall back to a typical service length so the card can still
// show an end time, clearly marked as an estimate rather than official data.
export const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export function timeUntilLabel(startAt: string): string {
  const ms = new Date(startAt).getTime() - Date.now();
  if (ms <= 0) return "Happening now";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days > 0) return `In ${days}d ${hours}h`;
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  if (hours > 0) return `In ${hours}h ${minutes}m`;
  return `In ${minutes}m`;
}
