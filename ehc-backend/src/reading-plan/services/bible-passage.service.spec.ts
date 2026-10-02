import { BiblePassageService } from './bible-passage.service';
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
