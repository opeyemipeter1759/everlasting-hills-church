import { addDays } from './local-date.util';
import { DAILY_VERSES, ROTATION_START, verseForDate } from './verse-of-the-day';
import { toVerseId } from './verse-id.util';

describe('daily scripture rotation', () => {
  it('visits every curated selection once before repeating', () => {
    DAILY_VERSES.forEach(([book, chapter, from, to], index) => {
      expect(verseForDate(addDays(ROTATION_START, index))).toEqual({
        index,
        startVerseId: toVerseId(book, chapter, from),
        endVerseId: toVerseId(book, chapter, to ?? from),
      });
    });
    expect(verseForDate(addDays(ROTATION_START, DAILY_VERSES.length))).toEqual(
      verseForDate(ROTATION_START),
    );
  });

  it('wraps dates before the rotation start and handles leap days deterministically', () => {
    expect(verseForDate(addDays(ROTATION_START, -1)).index).toBe(
      DAILY_VERSES.length - 1,
    );
    expect(verseForDate('2028-03-01').index).toBe(
      (verseForDate('2028-02-29').index + 1) % DAILY_VERSES.length,
    );
  });
});
