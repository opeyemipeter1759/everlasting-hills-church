import { chapterRange, fromVerseId, inRange, toVerseId } from './verse-id.util';

/**
 * Section 14, tests 1 and 2 of the reading plan specification.
 *
 * The verse id is the address scheme every plan, portion and passage query is
 * written against. If encoding is wrong anywhere, a plan silently points at the
 * wrong scripture, so this covers the whole canon rather than a few samples.
 */
describe('verse id encoding', () => {
  it('matches the canonical anchors', () => {
    expect(toVerseId(1, 1, 1)).toBe(1_001_001); // Genesis 1:1
    expect(toVerseId(43, 3, 16)).toBe(43_003_016); // John 3:16
    expect(toVerseId(19, 119, 176)).toBe(19_119_176); // Psalm 119:176
    expect(toVerseId(66, 22, 21)).toBe(66_022_021); // Revelation 22:21
  });

  it('round trips across all 66 books', () => {
    for (let bookId = 1; bookId <= 66; bookId += 1) {
      for (const [chapter, verse] of [
        [1, 1],
        [7, 13],
        [119, 176],
        [150, 999],
      ] as const) {
        const id = toVerseId(bookId, chapter, verse);
        expect(fromVerseId(id)).toEqual({ bookId, chapter, verse });
      }
    }
  });

  it('stays inside a signed 32 bit integer at the top of the canon', () => {
    const highest = toVerseId(66, 150, 176);
    expect(highest).toBe(66_150_176);
    expect(highest).toBeLessThan(2_147_483_647);
  });

  it('refuses references outside the canon rather than encoding nonsense', () => {
    expect(() => toVerseId(0, 1, 1)).toThrow(RangeError);
    expect(() => toVerseId(67, 1, 1)).toThrow(RangeError);
    expect(() => toVerseId(1, 1, 1000)).toThrow(RangeError);
    expect(() => toVerseId(1, 1, 1.5)).toThrow(RangeError);
  });
});

describe('ranges', () => {
  it('covers whole chapters without reaching the next one', () => {
    const genesis1to3 = chapterRange(1, 1, 3);
    expect(genesis1to3).toEqual({ startVerseId: 1_001_001, endVerseId: 1_003_999 });

    // The first verse of Genesis 4 sits above the range, so a chapter request
    // cannot pick up the chapter that follows it.
    expect(inRange(toVerseId(1, 4, 1), genesis1to3.startVerseId, genesis1to3.endVerseId)).toBe(false);
    expect(inRange(toVerseId(1, 3, 24), genesis1to3.startVerseId, genesis1to3.endVerseId)).toBe(true);
  });

  it('never leaks into the neighbouring book', () => {
    // Malachi is book 39 with 4 chapters; Matthew is 40. Asking for far more
    // chapters than Malachi has must still stop before Matthew 1:1.
    const malachi = chapterRange(39, 1, 999);
    expect(inRange(toVerseId(40, 1, 1), malachi.startVerseId, malachi.endVerseId)).toBe(false);

    // And the last verse of the previous book stays outside.
    expect(inRange(toVerseId(38, 14, 21), malachi.startVerseId, malachi.endVerseId)).toBe(false);
  });

  it('expresses a reading that crosses a book boundary as one range', () => {
    // Malachi 4 through Matthew 1, the reading that closes the Old Testament
    // and opens the New. One predicate, not two rows.
    const start = toVerseId(39, 4, 1);
    const end = toVerseId(40, 1, 25);

    expect(end).toBeGreaterThan(start);
    expect(inRange(toVerseId(39, 4, 6), start, end)).toBe(true);
    expect(inRange(toVerseId(40, 1, 25), start, end)).toBe(true);
    expect(inRange(toVerseId(40, 2, 1), start, end)).toBe(false);
  });

  it('rejects a backwards range', () => {
    expect(() => chapterRange(1, 5, 2)).toThrow(RangeError);
  });
});
