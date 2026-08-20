/**
 * The order gatherings are listed in for members.
 *
 * Split out of the panel for the same reason the countdown formatting was:
 * the interesting cases here are orderings, not markup, and a pure function
 * lets them be asserted without rendering anything.
 */

/** The ordering inputs. Structural so it accepts a full `Gathering` unchanged. */
export interface OrderableGathering {
  isLive: boolean;
  nextOccurrenceAt: string | null;
}

/**
 * Live gatherings first, then soonest next.
 *
 * A gathering with no next occurrence sorts last rather than being dropped: a
 * weekly rule anchored in the future has nothing to count down to yet, but it
 * is still scheduled, and the panel can describe it by its recurrence instead.
 *
 * Returns a new array — the caller's data comes from the query cache, which
 * must not be sorted in place.
 */
export function orderGatherings<T extends OrderableGathering>(gatherings: readonly T[]): T[] {
  return [...gatherings].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    if (!a.nextOccurrenceAt && !b.nextOccurrenceAt) return 0;
    if (!a.nextOccurrenceAt) return 1;
    if (!b.nextOccurrenceAt) return -1;
    // ISO-8601 UTC instants sort correctly as strings, so this needs no parsing.
    return a.nextOccurrenceAt.localeCompare(b.nextOccurrenceAt);
  });
}
