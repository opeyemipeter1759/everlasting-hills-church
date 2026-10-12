import { BiblePassageService, MAX_VERSES } from './bible-passage.service';
import { toVerseId } from '../verse-id.util';

describe('BiblePassageService external translations', () => {
  function makeService() {
    const prisma = {
      bibleTranslation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      bibleVerse: { findMany: jest.fn() },
      bibleBook: { findUnique: jest.fn(), findMany: jest.fn() },
    };
    return { service: new BiblePassageService(prisma as never), prisma };
  }

  it('returns licensed NKJV chapter links without querying stored verse text', async () => {
    const { service, prisma } = makeService();
    prisma.bibleTranslation.findUnique.mockResolvedValue({
      id: 3,
      code: 'NKJV',
      name: 'New King James Version',
      licence: 'external-youversion',
      isDefault: false,
    });
    prisma.bibleBook.findUnique.mockResolvedValue({ name: 'John' });

    const passage = await service.passage({
      translationCode: 'nkjv',
      startVerseId: toVerseId(43, 3, 1),
      endVerseId: toVerseId(43, 4, 54),
    });

    expect(prisma.bibleVerse.findMany).not.toHaveBeenCalled();
    expect(passage).toMatchObject({
      translation: { code: 'NKJV', name: 'New King James Version' },
      reference: 'John 3:1-4:54',
      verses: [],
      externalLinks: [
        { label: 'John 3', url: 'https://www.bible.com/bible/114/JHN.3.NKJV' },
        { label: 'John 4', url: 'https://www.bible.com/bible/114/JHN.4.NKJV' },
      ],
    });
  });

  it('keeps external translations out of the daily-scripture list', async () => {
    const { service, prisma } = makeService();
    prisma.bibleTranslation.findMany.mockResolvedValue([]);

    await service.translations();
    expect(prisma.bibleTranslation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { licence: { not: 'external-youversion' } },
      }),
    );

    await service.translations('reading-plan');
    expect(prisma.bibleTranslation.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });
});

describe('BiblePassageService long readings', () => {
  it('loads a whole day of the fast plans: over 500 verses of one Gospel', async () => {
    const verses = Array.from({ length: 540 }, (_, i) => ({
      verseId: toVerseId(40, 1 + Math.floor(i / 30), 1 + (i % 30)),
      bookId: 40,
      chapter: 1 + Math.floor(i / 30),
      verse: 1 + (i % 30),
      text: 'Text',
    }));
    const prisma = {
      bibleTranslation: { findUnique: jest.fn().mockResolvedValue({ id: 1, code: 'WEB', name: 'World English Bible', licence: 'public-domain' }) },
      bibleVerse: { findMany: jest.fn().mockResolvedValue(verses) },
      bibleBook: { findMany: jest.fn().mockResolvedValue([{ id: 40, name: 'Matthew', shortName: 'Mat' }]) },
    };
    const service = new BiblePassageService(prisma as never);

    const passage = await service.passage({ translationCode: 'WEB', startVerseId: toVerseId(40, 1, 1), endVerseId: toVerseId(40, 18, 30) });

    expect(passage.verses).toHaveLength(540);
    expect(passage.reference).toBe('Matthew 1:1-18:30');
  });

  it('allows any single book in one request, Psalms being the longest', () => {
    // A plan portion never crosses a book, so this covers every day of every plan.
    expect(MAX_VERSES).toBeGreaterThanOrEqual(2_461);
  });
});
