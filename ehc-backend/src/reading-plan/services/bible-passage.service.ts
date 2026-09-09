import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { fromVerseId } from '../verse-id.util';

/** A passage cannot be larger than this in one request. */
const MAX_VERSES = 400;

/**
 * Scripture text by verse range.
 *
 * This is the highest leverage cache in the feature. The text never changes, so
 * a response can be cached for a year. A 365 day plan across three portions and
 * two translations is roughly 2,200 distinct URLs, which fits in an edge cache
 * and reaches a hit rate near 99 percent within days.
 *
 * Nothing member specific may ever enter this response, or the private part
 * poisons the shared cache for everybody.
 */
@Injectable()
export class BiblePassageService {
  constructor(private readonly prisma: PrismaService) {}

  async passage(input: { translationCode?: string; startVerseId: number; endVerseId: number }) {
    const { startVerseId, endVerseId } = input;

    if (endVerseId < startVerseId) {
      throw new BadRequestException('The end of the passage is before its start');
    }

    const translation = input.translationCode
      ? await this.prisma.bibleTranslation.findUnique({
          where: { code: input.translationCode.toUpperCase() },
        })
      : await this.prisma.bibleTranslation.findFirst({ where: { isDefault: true } });

    if (!translation) {
      throw new NotFoundException(`No translation ${input.translationCode ?? '(default)'}`);
    }

    // One range scan on the primary key. This is what the integer verse id
    // buys: any passage, however it spans chapters or books, is one predicate.
    const verses = await this.prisma.bibleVerse.findMany({
      where: { translationId: translation.id, verseId: { gte: startVerseId, lte: endVerseId } },
      orderBy: { verseId: 'asc' },
      take: MAX_VERSES + 1,
      select: { verseId: true, bookId: true, chapter: true, verse: true, text: true },
    });

    if (verses.length > MAX_VERSES) {
      throw new BadRequestException(
        `A passage may cover at most ${MAX_VERSES} verses. Request it in parts.`,
      );
    }
    if (verses.length === 0) {
      throw new NotFoundException('No verses in that range');
    }

    const books = await this.prisma.bibleBook.findMany({
      where: { id: { in: [...new Set(verses.map((v) => v.bookId))] } },
      select: { id: true, name: true, shortName: true },
    });
    const bookNames = new Map(books.map((b) => [b.id, b.id === 19 ? 'Psalm' : b.name]));

    const first = fromVerseId(verses[0].verseId);
    const last = fromVerseId(verses[verses.length - 1].verseId);
    const firstBook = bookNames.get(first.bookId) ?? `Book ${first.bookId}`;
    const lastBook = bookNames.get(last.bookId) ?? `Book ${last.bookId}`;

    const reference =
      first.bookId !== last.bookId
        ? `${firstBook} ${first.chapter}:${first.verse} to ${lastBook} ${last.chapter}:${last.verse}`
        : first.chapter !== last.chapter
          ? `${firstBook} ${first.chapter}:${first.verse}-${last.chapter}:${last.verse}`
          : first.verse === last.verse
            ? `${firstBook} ${first.chapter}:${first.verse}`
            : `${firstBook} ${first.chapter}:${first.verse}-${last.verse}`;

    return {
      translation: { code: translation.code, name: translation.name },
      reference,
      startVerseId,
      endVerseId,
      verses: verses.map((verse) => ({
        verseId: verse.verseId,
        book: bookNames.get(verse.bookId) ?? `Book ${verse.bookId}`,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      })),
    };
  }

  /** Translations a member can choose between. */
  async translations() {
    return this.prisma.bibleTranslation.findMany({
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
      select: { id: true, code: true, name: true, licence: true, isDefault: true },
    });
  }
}
