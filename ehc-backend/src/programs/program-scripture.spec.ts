import { formatReference, parseReference, verseRange, type BookName } from './program-scripture';

const books: BookName[] = [
  { id: 1, name: 'Genesis', shortName: 'Gen', osisCode: 'Gen' },
  { id: 19, name: 'Psalms', shortName: 'Ps', osisCode: 'Ps' },
  { id: 23, name: 'Isaiah', shortName: 'Isa', osisCode: 'Isa' },
  { id: 42, name: 'Luke', shortName: 'Luke', osisCode: 'Luke' },
  { id: 62, name: '1 John', shortName: '1Jn', osisCode: '1John' },
];

describe('scripture references', () => {
  it('reads a verse range, a single verse, a whole chapter and a passage across chapters', () => {
    expect(parseReference('Isaiah 62:6-7', books)).toEqual({ bookId: 23, chapter: 62, verseStart: 6, chapterEnd: null, verseEnd: 7 });
    expect(parseReference('gen 27:28', books)).toEqual({ bookId: 1, chapter: 27, verseStart: 28, chapterEnd: null, verseEnd: null });
    expect(parseReference('Psalm 23', books)).toEqual({ bookId: 19, chapter: 23, verseStart: null, chapterEnd: null, verseEnd: null });
    expect(parseReference('Luke 3:21-4:2', books)).toEqual({ bookId: 42, chapter: 3, verseStart: 21, chapterEnd: 4, verseEnd: 2 });
    expect(parseReference('1 John 1:9', books)?.bookId).toBe(62);
  });

  it('refuses a book that does not exist, a backwards range and nonsense', () => {
    expect(parseReference('Hezekiah 3:1', books)).toBeNull();
    expect(parseReference('Isaiah 62:7-6', books)).toBeNull();
    expect(parseReference('Luke 4:2-3:1', books)).toBeNull();
    expect(parseReference('not a verse', books)).toBeNull();
  });

  it('writes references the way people do, and maps them to verse ids', () => {
    expect(formatReference({ bookId: 23, chapter: 62, verseStart: 6, chapterEnd: null, verseEnd: 7 }, 'Isaiah')).toBe('Isaiah 62:6-7');
    expect(formatReference({ bookId: 19, chapter: 23, verseStart: null, chapterEnd: null, verseEnd: null }, 'Psalms')).toBe('Psalm 23');
    expect(formatReference({ bookId: 42, chapter: 24, verseStart: 49, chapterEnd: null, verseEnd: null }, 'Luke')).toBe('Luke 24:49');
    expect(verseRange({ bookId: 23, chapter: 62, verseStart: 6, chapterEnd: null, verseEnd: 7 })).toEqual({ start: 23062006, end: 23062007 });
    expect(verseRange({ bookId: 19, chapter: 23, verseStart: null, chapterEnd: null, verseEnd: null })).toEqual({ start: 19023001, end: 19023999 });
  });
});
