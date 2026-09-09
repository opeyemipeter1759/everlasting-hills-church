import { toVerseId } from './verse-id.util';

/**
 * Plan generation.
 *
 * Reading plans are declared as a spec and generated, never hand authored. A
 * 365 day plan with four streams is some 1,400 day and portion rows; writing
 * those by hand is how a plan ends up with Psalm 117 (2 verses) and Psalm 119
 * (176 verses) on consecutive days.
 *
 * Two rules govern the packing:
 *
 *  1. Never split a chapter across days. Chapter divisions are a 13th century
 *     artifact and imperfect, but they are the smallest unit a reader
 *     recognises, and a day that ends mid argument is worse than one that runs
 *     slightly long.
 *  2. Balance by words, not by chapters. This is only possible because the
 *     corpus carries a word count per verse, and it is the payoff for the
 *     ingest work.
 */

/** One chapter of one book, with its real verse bounds taken from the corpus. */
export interface ChapterUnit {
  bookId: number;
  chapter: number;
  /** Real first and last verse, resolved against the text rather than assumed. */
  startVerseId: number;
  endVerseId: number;
  wordCount: number;
}

export interface StreamSpec {
  label: string;
  /** Book ids in reading order, or explicit chapters for a curated selection. */
  selection: BookSelection[];
  optional?: boolean;
}

export type BookSelection =
  | { bookId: number }
  | { bookId: number; fromChapter: number; toChapter: number }
  | { bookId: number; chapters: number[] };

export interface SegmentSpec {
  /** Days this segment occupies. Segments let a track prescribe its shape. */
  days: number;
  selection: BookSelection[];
}

/**
 * Splits chapters across exactly `days` days, balancing word counts.
 *
 * A plain greedy fill against a fixed budget cannot promise an exact day count:
 * it overshoots or undershoots and the plan ends up 358 or 371 days long. This
 * walks a running target instead. Day i should end at totalWords * i / days, so
 * chapters are taken until the running total reaches that line, subject to two
 * hard constraints: every day gets at least one chapter, and enough chapters
 * are left for every remaining day.
 *
 * The result is exactly `days` groups, none empty, no chapter split.
 */
export function balanceIntoDays(units: ChapterUnit[], days: number): ChapterUnit[][] {
  if (days < 1) throw new RangeError(`days must be at least 1, received ${days}`);
  if (units.length < days) {
    throw new RangeError(
      `Cannot fill ${days} days from ${units.length} chapters without splitting one. ` +
        'Either shorten the plan or widen its book selection.',
    );
  }

  const totalWords = units.reduce((sum, unit) => sum + unit.wordCount, 0);
  const result: ChapterUnit[][] = [];
  let cursor = 0;
  let consumedWords = 0;

  for (let day = 1; day <= days; day += 1) {
    const daysLeftAfterThis = days - day;
    // Leave at least one chapter for each remaining day.
    const maxCursor = units.length - daysLeftAfterThis;
    const target = (totalWords * day) / days;

    const group: ChapterUnit[] = [units[cursor]];
    consumedWords += units[cursor].wordCount;
    cursor += 1;

    while (cursor < maxCursor) {
      const next = units[cursor];
      // Take the next chapter while it keeps the day closer to its target than
      // stopping would. Comparing distances rather than testing "under budget"
      // is what keeps a long chapter from always landing on the following day.
      const stopDistance = Math.abs(consumedWords - target);
      const takeDistance = Math.abs(consumedWords + next.wordCount - target);
      if (takeDistance >= stopDistance) break;

      group.push(next);
      consumedWords += next.wordCount;
      cursor += 1;
    }

    result.push(group);
  }

  // Anything left over (possible only through rounding at the tail) joins the
  // final day rather than being dropped.
  if (cursor < units.length) {
    result[result.length - 1].push(...units.slice(cursor));
  }

  return result;
}

/**
 * Distributes a stream across a fixed number of days, allowing empty days.
 *
 * balanceIntoDays insists every day gets a chapter, which is right for a single
 * stream plan but wrong for a multi stream one. The New Testament is 260
 * chapters; across 365 days it cannot appear every day without splitting a
 * chapter, and it should not. On a two stream plan the Psalm carries those days
 * instead, which is exactly what "the New Testament with a Psalm each day"
 * describes.
 *
 * With at least one chapter per day it balances by words as usual. With fewer,
 * the chapters spread evenly across the span so the gaps fall regularly rather
 * than leaving a barren December.
 */
export function spreadAcrossDays(units: ChapterUnit[], days: number): ChapterUnit[][] {
  if (days < 1) throw new RangeError(`days must be at least 1, received ${days}`);
  if (units.length >= days) return balanceIntoDays(units, days);

  const result: ChapterUnit[][] = Array.from({ length: days }, () => []);
  units.forEach((unit, index) => {
    const day = Math.min(days - 1, Math.floor((index * days) / units.length));
    result[day].push(unit);
  });
  return result;
}

/**
 * A reader facing label such as "Genesis 1-3" or "Psalm 23".
 *
 * Consecutive chapters of one book collapse into a range, and separate books
 * are joined so a four stream day reads as
 * "Genesis 1-3 · Psalm 23 · Matthew 1".
 */
export function formatReference(units: ChapterUnit[], bookNames: Map<number, string>): string {
  if (units.length === 0) return '';

  const parts: string[] = [];
  let runStart = units[0];
  let runEnd = units[0];

  const flush = () => {
    const name = bookNames.get(runStart.bookId) ?? `Book ${runStart.bookId}`;
    parts.push(
      runStart.chapter === runEnd.chapter
        ? `${name} ${runStart.chapter}`
        : `${name} ${runStart.chapter}-${runEnd.chapter}`,
    );
  };

  for (const unit of units.slice(1)) {
    const contiguous = unit.bookId === runEnd.bookId && unit.chapter === runEnd.chapter + 1;
    if (contiguous) {
      runEnd = unit;
      continue;
    }
    flush();
    runStart = unit;
    runEnd = unit;
  }
  flush();

  return parts.join(' · ');
}

/**
 * Contiguous chapters become one portion, so a day of Genesis 1 to 3 is a
 * single range rather than three rows. A gap starts a new portion, which is
 * what keeps a curated Psalm selection honest.
 */
export function toPortionRanges(
  units: ChapterUnit[],
): { startVerseId: number; endVerseId: number; wordCount: number }[] {
  const ranges: { startVerseId: number; endVerseId: number; wordCount: number }[] = [];

  for (const unit of units) {
    const last = ranges[ranges.length - 1];
    const contiguous = last && unit.startVerseId === last.endVerseId + 1;
    // Contiguity is checked on verse ids, not chapter numbers, so a range can
    // never silently jump a book boundary.
    const sameBookNextChapter =
      last &&
      Math.floor(unit.startVerseId / 1_000_000) === Math.floor(last.endVerseId / 1_000_000) &&
      Math.floor((unit.startVerseId % 1_000_000) / 1_000) ===
        Math.floor((last.endVerseId % 1_000_000) / 1_000) + 1;

    if (last && (contiguous || sameBookNextChapter)) {
      last.endVerseId = unit.endVerseId;
      last.wordCount += unit.wordCount;
      continue;
    }

    ranges.push({
      startVerseId: unit.startVerseId,
      endVerseId: unit.endVerseId,
      wordCount: unit.wordCount,
    });
  }

  return ranges;
}

/** 200 words per minute, floor of one, so no day reads as "0 minutes". */
export function estimateMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

/** Expands a book selection into the chapter units it names, in reading order. */
export function selectChapters(
  selection: BookSelection[],
  chaptersByBook: Map<number, ChapterUnit[]>,
): ChapterUnit[] {
  const units: ChapterUnit[] = [];

  for (const entry of selection) {
    const all = chaptersByBook.get(entry.bookId);
    if (!all || all.length === 0) {
      throw new Error(`No chapters loaded for book ${entry.bookId}. Seed the corpus first.`);
    }

    if ('chapters' in entry) {
      for (const chapter of entry.chapters) {
        const unit = all.find((c) => c.chapter === chapter);
        if (!unit) throw new Error(`Book ${entry.bookId} has no chapter ${chapter}`);
        units.push(unit);
      }
      continue;
    }

    if ('fromChapter' in entry) {
      units.push(
        ...all.filter((c) => c.chapter >= entry.fromChapter && c.chapter <= entry.toChapter),
      );
      continue;
    }

    units.push(...all);
  }

  return units;
}

/**
 * Cycles a stream so it fills the whole plan.
 *
 * The GROWING track reads Psalms then Proverbs beside the New Testament: 181
 * chapters against 365 days, so the selection repeats. Without this the stream
 * would run dry in October.
 */
export function cycleToAtLeast(units: ChapterUnit[], minimum: number): ChapterUnit[] {
  if (units.length === 0) throw new Error('Cannot cycle an empty selection');
  const out: ChapterUnit[] = [];
  while (out.length < minimum) out.push(...units);
  return out;
}

/** Convenience for tests and specs: the verse id a chapter starts at. */
export function chapterStart(bookId: number, chapter: number): number {
  return toVerseId(bookId, chapter, 1);
}
