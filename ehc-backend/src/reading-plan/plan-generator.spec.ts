import {
  balanceIntoDays,
  cycleToAtLeast,
  estimateMinutes,
  formatReference,
  selectChapters,
  spreadAcrossDays,
  toPortionRanges,
  type ChapterUnit,
} from './plan-generator';
import { toVerseId } from './verse-id.util';

/**
 * Section 14, test 9 of the specification: a generated plan has exactly
 * durationDays days and no chapter is split across days.
 */
function chapter(bookId: number, chapterNumber: number, lastVerse: number, words: number): ChapterUnit {
  return {
    bookId,
    chapter: chapterNumber,
    startVerseId: toVerseId(bookId, chapterNumber, 1),
    endVerseId: toVerseId(bookId, chapterNumber, lastVerse),
    wordCount: words,
  };
}

/** Psalms sized roughly like the real thing, including the two extremes. */
const PSALMS: ChapterUnit[] = [
  chapter(19, 117, 2, 33), // shortest chapter in the Bible
  chapter(19, 118, 29, 600),
  chapter(19, 119, 176, 2_500), // longest
  chapter(19, 120, 7, 120),
  chapter(19, 121, 8, 130),
  chapter(19, 122, 9, 150),
];

describe('balanceIntoDays', () => {
  it('produces exactly the requested number of days', () => {
    for (const days of [1, 2, 3, 5, 6]) {
      expect(balanceIntoDays(PSALMS, days)).toHaveLength(days);
    }
  });

  it('never splits a chapter and never loses one', () => {
    const days = balanceIntoDays(PSALMS, 3);
    const flattened = days.flat();

    expect(flattened).toHaveLength(PSALMS.length);
    // Same chapters, same order, each appearing once and whole.
    expect(flattened.map((c) => c.chapter)).toEqual(PSALMS.map((c) => c.chapter));
  });

  it('gives every day at least one chapter', () => {
    const days = balanceIntoDays(PSALMS, 6);
    expect(days.every((day) => day.length >= 1)).toBe(true);
  });

  it('balances by words rather than by chapter count', () => {
    // Psalm 119 is 2,500 words against Psalm 117's 33. A chapter per day plan
    // would put them on consecutive days as equals; word balancing must not.
    const days = balanceIntoDays(PSALMS, 3);
    const withPsalm119 = days.find((day) => day.some((c) => c.chapter === 119))!;

    expect(withPsalm119).toHaveLength(1);
    const shortDay = days.find((day) => day.some((c) => c.chapter === 117))!;
    expect(shortDay.length).toBeGreaterThan(1);
  });

  it('refuses to fill more days than there are chapters', () => {
    expect(() => balanceIntoDays(PSALMS, 7)).toThrow(/without splitting one/);
  });

  it('handles a one day plan by giving it everything', () => {
    expect(balanceIntoDays(PSALMS, 1)[0]).toHaveLength(PSALMS.length);
  });
});

describe('formatReference', () => {
  const names = new Map([
    [1, 'Genesis'],
    [19, 'Psalm'],
    [40, 'Matthew'],
  ]);

  it('collapses consecutive chapters into a range', () => {
    const units = [chapter(1, 1, 31, 800), chapter(1, 2, 25, 600), chapter(1, 3, 24, 500)];
    expect(formatReference(units, names)).toBe('Genesis 1-3');
  });

  it('names a single chapter without a range', () => {
    expect(formatReference([chapter(19, 23, 6, 120)], names)).toBe('Psalm 23');
  });

  it('joins separate books', () => {
    const units = [chapter(1, 1, 31, 800), chapter(19, 23, 6, 120), chapter(40, 1, 25, 400)];
    expect(formatReference(units, names)).toBe('Genesis 1 · Psalm 23 · Matthew 1');
  });

  it('breaks a run where the chapters are not adjacent', () => {
    const units = [chapter(19, 1, 6, 90), chapter(19, 23, 6, 120)];
    expect(formatReference(units, names)).toBe('Psalm 1 · Psalm 23');
  });
});

describe('toPortionRanges', () => {
  it('merges adjacent chapters into one range', () => {
    const ranges = toPortionRanges([chapter(1, 1, 31, 800), chapter(1, 2, 25, 600)]);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].startVerseId).toBe(toVerseId(1, 1, 1));
    expect(ranges[0].endVerseId).toBe(toVerseId(1, 2, 25));
    expect(ranges[0].wordCount).toBe(1_400);
  });

  it('keeps a curated selection as separate ranges', () => {
    const ranges = toPortionRanges([chapter(19, 1, 6, 90), chapter(19, 23, 6, 120)]);
    expect(ranges).toHaveLength(2);
  });

  it('never merges across a book boundary', () => {
    // Malachi 4 and Matthew 1 are adjacent in reading order but different books.
    const ranges = toPortionRanges([chapter(39, 4, 6, 200), chapter(40, 1, 25, 400)]);
    expect(ranges).toHaveLength(2);
  });
});

describe('estimateMinutes', () => {
  it('reads at 200 words a minute', () => {
    expect(estimateMinutes(1_600)).toBe(8);
    expect(estimateMinutes(3_000)).toBe(15);
  });

  it('never reports a day as zero minutes', () => {
    expect(estimateMinutes(33)).toBe(1);
    expect(estimateMinutes(0)).toBe(1);
  });
});

describe('selectChapters', () => {
  const chaptersByBook = new Map([[19, PSALMS]]);

  it('takes a whole book', () => {
    expect(selectChapters([{ bookId: 19 }], chaptersByBook)).toHaveLength(PSALMS.length);
  });

  it('takes a chapter range', () => {
    const units = selectChapters([{ bookId: 19, fromChapter: 118, toChapter: 120 }], chaptersByBook);
    expect(units.map((u) => u.chapter)).toEqual([118, 119, 120]);
  });

  it('takes a curated list in the order given', () => {
    const units = selectChapters([{ bookId: 19, chapters: [121, 117] }], chaptersByBook);
    expect(units.map((u) => u.chapter)).toEqual([121, 117]);
  });

  it('fails loudly on a chapter the corpus does not have', () => {
    expect(() => selectChapters([{ bookId: 19, chapters: [999] }], chaptersByBook)).toThrow(
      /no chapter 999/,
    );
  });
});

describe('cycleToAtLeast', () => {
  it('repeats a short selection so a stream never runs dry', () => {
    const cycled = cycleToAtLeast(PSALMS, 20);
    expect(cycled.length).toBeGreaterThanOrEqual(20);
    expect(cycled[0].chapter).toBe(PSALMS[0].chapter);
    expect(cycled[PSALMS.length].chapter).toBe(PSALMS[0].chapter);
  });
});

describe('spreadAcrossDays', () => {
  it('balances by words when the stream can fill every day', () => {
    const days = spreadAcrossDays(PSALMS, 3);
    expect(days).toHaveLength(3);
    expect(days.every((day) => day.length >= 1)).toBe(true);
  });

  it('leaves regular gaps when the stream is shorter than the plan', () => {
    // Three chapters across ten days: the New Testament against a year, in
    // miniature. Every chapter appears once, in order, and the gaps are spread.
    const days = spreadAcrossDays(PSALMS.slice(0, 3), 10);

    expect(days).toHaveLength(10);
    expect(days.flat()).toHaveLength(3);
    expect(days.filter((day) => day.length > 0)).toHaveLength(3);

    const occupied = days.map((day, i) => (day.length ? i : -1)).filter((i) => i >= 0);
    expect(occupied).toEqual([0, 3, 6]);
  });

  it('keeps reading order across the gaps', () => {
    const days = spreadAcrossDays(PSALMS.slice(0, 4), 12);
    expect(days.flat().map((c) => c.chapter)).toEqual([117, 118, 119, 120]);
  });
});
