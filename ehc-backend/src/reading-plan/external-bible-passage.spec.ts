import { BadRequestException } from '@nestjs/common';
import { nkjvChapterLinks } from './external-bible-passage';
import { toVerseId } from './verse-id.util';

describe('NKJV external passage links', () => {
  it('opens every assigned chapter in YouVersion NKJV', () => {
    expect(
      nkjvChapterLinks(toVerseId(43, 3, 1), toVerseId(43, 5, 47), 'John'),
    ).toEqual([
      { label: 'John 3', url: 'https://www.bible.com/bible/114/JHN.3.NKJV' },
      { label: 'John 4', url: 'https://www.bible.com/bible/114/JHN.4.NKJV' },
      { label: 'John 5', url: 'https://www.bible.com/bible/114/JHN.5.NKJV' },
    ]);
  });

  it('uses YouVersion book ids for numbered books', () => {
    expect(
      nkjvChapterLinks(toVerseId(62, 1, 1), toVerseId(62, 1, 10), '1 John'),
    ).toEqual([
      { label: '1 John 1', url: 'https://www.bible.com/bible/114/1JN.1.NKJV' },
    ]);
  });

  it('rejects a range that crosses books', () => {
    expect(() =>
      nkjvChapterLinks(toVerseId(39, 4, 1), toVerseId(40, 1, 25), 'Malachi'),
    ).toThrow(BadRequestException);
  });
});
