"use client";

import { HILLS_CONFESSION } from "@/lib/hills-confession";
import { readyWordOfTheDay, useWordOfTheDay, type ReadyWordOfTheDay } from "@/lib/sermon-digest";
import type { ConfessionShare } from "@/lib/scripture-share";

export interface HillsConfessionToday {
  /** One line per breath, as said out loud. */
  lines: string[];
  /** The sermon the middle lines came from; null while the fixed confession is shown. */
  sermon: ReadyWordOfTheDay | null;
  /** "From Wednesday’s sermon", for labels and the shared image. */
  source: string;
  /** Everything the status image and copied text need. */
  share: ConfessionShare;
}

/**
 * Today's Hills Confession. The church's own opening and closing lines always
 * stay; the declarations between them come from the latest Sunday or
 * Wednesday sermon's Word of the Day. Until a sermon has been summarised (or
 * while it loads) it is the fixed confession from lib/hills-confession.
 */
export function useHillsConfession(date: string): HillsConfessionToday {
  const { data } = useWordOfTheDay();
  const ready = readyWordOfTheDay(data);
  const sermon = ready && ready.confession.length > 0 ? ready : null;

  const lines = sermon
    ? [HILLS_CONFESSION[0], ...sermon.confession, HILLS_CONFESSION[HILLS_CONFESSION.length - 1]]
    : [...HILLS_CONFESSION];
  const day = sermon?.serviceDay === "WEDNESDAY" ? "Wednesday’s" : sermon?.serviceDay === "SUNDAY" ? "Sunday’s" : "our latest";
  const source = sermon ? `From ${day} sermon` : "The confession of Everlasting Hills";

  return {
    lines,
    sermon,
    source,
    share: {
      date,
      lines,
      ...(sermon && { sermon: { word: sermon.word, verseReference: sermon.verse.reference, source } }),
    },
  };
}
