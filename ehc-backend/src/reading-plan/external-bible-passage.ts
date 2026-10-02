import { BadRequestException } from '@nestjs/common';
import { fromVerseId } from './verse-id.util';

/**
 * YouVersion's book ids in the same 1..66 order as BibleBook.
 *
 * NKJV is licensed to YouVersion by Thomas Nelson. We link readers to that
 * licensed copy instead of storing or redistributing the copyrighted text.
 */
const YOUVERSION_BOOK_IDS = [
  'GEN',
  'EXO',
  'LEV',
  'NUM',
  'DEU',
  'JOS',
  'JDG',
  'RUT',
  '1SA',
  '2SA',
  '1KI',
  '2KI',
  '1CH',
  '2CH',
  'EZR',
  'NEH',
  'EST',
  'JOB',
  'PSA',
  'PRO',
  'ECC',
  'SNG',
  'ISA',
  'JER',
  'LAM',
  'EZK',
  'DAN',
  'HOS',
  'JOL',
  'AMO',
  'OBA',
  'JON',
  'MIC',
  'NAM',
  'HAB',
  'ZEP',
  'HAG',
  'ZEC',
  'MAL',
  'MAT',
  'MRK',
  'LUK',
  'JHN',
  'ACT',
  'ROM',
  '1CO',
  '2CO',
  'GAL',
  'EPH',
  'PHP',
  'COL',
  '1TH',
  '2TH',
  '1TI',
  '2TI',
  'TIT',
  'PHM',
  'HEB',
  'JAS',
  '1PE',
  '2PE',
  '1JN',
  '2JN',
  '3JN',
  'JUD',
  'REV',
] as const;

const NKJV_VERSION_ID = 114;

export interface ExternalBibleLink {
  label: string;
  url: string;
}

/** One licensed NKJV link per assigned chapter. Reading-plan portions never join books. */
export function nkjvChapterLinks(
  startVerseId: number,
  endVerseId: number,
  bookName: string,
): ExternalBibleLink[] {
  const first = fromVerseId(startVerseId);
  const last = fromVerseId(endVerseId);
  if (first.bookId !== last.bookId) {
    throw new BadRequestException(
      'An external Bible passage cannot cross books',
    );
  }

  const bookId = YOUVERSION_BOOK_IDS[first.bookId - 1];
  if (!bookId)
    throw new BadRequestException(`No external Bible book ${first.bookId}`);

  return Array.from(
    { length: last.chapter - first.chapter + 1 },
    (_, index) => {
      const chapter = first.chapter + index;
      return {
        label: `${bookName} ${chapter}`,
        url: `https://www.bible.com/bible/${NKJV_VERSION_ID}/${bookId}.${chapter}.NKJV`,
      };
    },
  );
}
