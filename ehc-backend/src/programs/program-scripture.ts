import type { PrismaService } from '../prisma/prisma.service';
import { toVerseId } from '../reading-plan/verse-id.util';

/**
 * Scripture on a program: stored as a normalised reference, read from the
 * church's own Bible tables (BibleVerse) at request time. No verse text is
 * ever hardcoded.
 */
export interface ScriptureRef {
  bookId: number;
  chapter: number;
  verseStart: number | null;
  chapterEnd: number | null;
  verseEnd: number | null;
}
export interface BookName {
  id: number;
  name: string;
  shortName: string;
  osisCode: string;
}

const PATTERN = /^\s*((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*-\s*(?:(\d{1,3}):)?(\d{1,3}))?)?\s*$/;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "Isaiah 62:6-7", "Gen 27:28", "Malachi 3:1-3", "Psalm 23", "Luke 3:21-4:2". Null when it is not a reference to a real book. */
export function parseReference(text: string, books: BookName[]): ScriptureRef | null {
  const m = PATTERN.exec(text);
  if (!m) return null;
  const wanted = norm(m[1]);
  const book = books.find((b) => [b.name, b.shortName, b.osisCode, b.name.replace(/s$/, '')].some((n) => norm(n) === wanted));
  if (!book) return null;
  const chapter = Number(m[2]);
  const verseStart = m[3] ? Number(m[3]) : null;
  const chapterEnd = m[4] ? Number(m[4]) : null;
  const verseEnd = m[5] ? Number(m[5]) : null;
  if (chapter < 1 || (verseStart !== null && verseStart < 1)) return null;
  if (chapterEnd !== null && chapterEnd < chapter) return null;
  if (chapterEnd === null && verseEnd !== null && verseStart !== null && verseEnd < verseStart) return null;
  return { bookId: book.id, chapter, verseStart, chapterEnd, verseEnd };
}

/** The reference as people write it. Psalm 23, not Psalms 23. */
export function formatReference(ref: ScriptureRef, bookName: string): string {
  const name = ref.bookId === 19 ? 'Psalm' : bookName;
  if (ref.verseStart === null) return `${name} ${ref.chapter}`;
  if (ref.chapterEnd !== null && ref.chapterEnd !== ref.chapter) return `${name} ${ref.chapter}:${ref.verseStart}-${ref.chapterEnd}:${ref.verseEnd ?? 1}`;
  return ref.verseEnd !== null && ref.verseEnd !== ref.verseStart ? `${name} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}` : `${name} ${ref.chapter}:${ref.verseStart}`;
}

export function verseRange(ref: ScriptureRef): { start: number; end: number } {
  const start = toVerseId(ref.bookId, ref.chapter, ref.verseStart ?? 1);
  const end = toVerseId(ref.bookId, ref.chapterEnd ?? ref.chapter, ref.verseEnd ?? ref.verseStart ?? 999);
  return { start, end };
}

export interface ResolvedScripture {
  reference: string;
  text: string | null;
  translation: string | null;
}

/**
 * Every reference's text in the default translation, in one verse query (one
 * OR of primary-key ranges). A reference with no verses in the table resolves
 * to null text rather than failing the page.
 */
export async function resolveScriptures(prisma: PrismaService, refs: ScriptureRef[]): Promise<ResolvedScripture[]> {
  if (!refs.length) return [];
  const [translation, books] = await Promise.all([
    prisma.bibleTranslation.findFirst({ where: { isDefault: true }, select: { id: true, code: true } }),
    prisma.bibleBook.findMany({ where: { id: { in: [...new Set(refs.map((r) => r.bookId))] } }, select: { id: true, name: true } }),
  ]);
  const names = new Map(books.map((b) => [b.id, b.name]));
  const ranges = refs.map(verseRange);
  const verses = translation
    ? await prisma.bibleVerse.findMany({
        where: { translationId: translation.id, OR: ranges.map((r) => ({ verseId: { gte: r.start, lte: r.end } })) },
        orderBy: { verseId: 'asc' },
        select: { verseId: true, text: true },
        take: 2000,
      })
    : [];
  return refs.map((ref, i) => {
    const r = ranges[i];
    const text = verses
      .filter((v) => v.verseId >= r.start && v.verseId <= r.end)
      .map((v) => v.text.trim())
      .join(' ');
    return { reference: formatReference(ref, names.get(ref.bookId) ?? `Book ${ref.bookId}`), text: text || null, translation: text ? (translation?.code ?? null) : null };
  });
}
