/**
 * The core primitive of the reading plan system.
 *
 *   verseId = bookId * 1000000 + chapter * 1000 + verse
 *
 * Genesis 1:1 is 1001001, John 3:16 is 43003016, Revelation 22:21 is 66022021.
 * The largest representable value is 66150176, comfortably inside a signed
 * 32 bit integer, which is why the column is INTEGER and not BIGINT.
 *
 * Why this and not (book, chapter, verseStart, verseEnd) per portion: any
 * passage, however it spans chapters or books, becomes one predicate,
 * `verseId BETWEEN start AND end`, served by the primary key. Canonical order
 * is free, since ORDER BY verseId is scripture order. The alternative cannot
 * express a reading that crosses a chapter boundary without a compound
 * predicate or several rows, which is the most common way these schemas go
 * wrong.
 */

export const CHAPTER_STRIDE = 1_000;
export const BOOK_STRIDE = 1_000_000;

/** Highest verse number a chapter can hold in this encoding. */
export const MAX_VERSE = 999;

export interface VerseRef {
  bookId: number;
  chapter: number;
  verse: number;
}

export function toVerseId(bookId: number, chapter: number, verse: number): number {
  if (!Number.isInteger(bookId) || bookId < 1 || bookId > 66) {
    throw new RangeError(`bookId must be 1 to 66, received ${bookId}`);
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 999) {
    throw new RangeError(`chapter must be 1 to 999, received ${chapter}`);
  }
  if (!Number.isInteger(verse) || verse < 1 || verse > MAX_VERSE) {
    throw new RangeError(`verse must be 1 to ${MAX_VERSE}, received ${verse}`);
  }
  return bookId * BOOK_STRIDE + chapter * CHAPTER_STRIDE + verse;
}

export function fromVerseId(verseId: number): VerseRef {
  return {
    bookId: Math.floor(verseId / BOOK_STRIDE),
    chapter: Math.floor((verseId % BOOK_STRIDE) / CHAPTER_STRIDE),
    verse: verseId % CHAPTER_STRIDE,
  };
}

/**
 * Inclusive bounds covering whole chapters.
 *
 * The end bound uses verse 999 rather than the chapter's real last verse, so a
 * caller does not need a versification table to ask for "all of Genesis 3". It
 * cannot overrun: chapter 3 ends at 1003999 and chapter 4 starts at 1004001,
 * and the last chapter of a book ends below the next book's first verse.
 */
export function chapterRange(
  bookId: number,
  fromChapter: number,
  toChapter: number = fromChapter,
): { startVerseId: number; endVerseId: number } {
  if (toChapter < fromChapter) {
    throw new RangeError(`toChapter ${toChapter} is before fromChapter ${fromChapter}`);
  }
  return {
    startVerseId: toVerseId(bookId, fromChapter, 1),
    endVerseId: toVerseId(bookId, toChapter, MAX_VERSE),
  };
}

/** True when a verse id falls inside an inclusive range. */
export function inRange(verseId: number, startVerseId: number, endVerseId: number): boolean {
  return verseId >= startVerseId && verseId <= endVerseId;
}
