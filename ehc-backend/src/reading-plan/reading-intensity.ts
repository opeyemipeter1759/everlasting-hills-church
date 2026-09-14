/** Reading load, independent of a member's spiritual maturity. */
export const READING_INTENSITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type ReadingIntensity = (typeof READING_INTENSITIES)[number];

export function readingIntensity(minutes: number | null | undefined): ReadingIntensity | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes <= 5) return 'LOW';
  if (minutes <= 15) return 'MEDIUM';
  return 'HIGH';
}
