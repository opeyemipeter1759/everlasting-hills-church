/**
 * One time ingest of the public domain scripture corpus: KJV and WEB.
 *
 *   npx ts-node --transpile-only scripts/seed-scripture.ts
 *   npx ts-node --transpile-only scripts/seed-scripture.ts --force   (re-ingest)
 *
 * Nothing in the running application ever fetches scripture. This script
 * downloads each source once into a gitignored cache, verifies it against a
 * checksum pinned below, and loads it. A source that changes upstream fails the
 * checksum and stops rather than quietly rewriting the corpus underneath plans
 * that already reference verse ranges.
 *
 * The corpus is about 62,000 rows and under 30 MB. It will never be a scale
 * problem, and it is the only body of text in this platform with no member data
 * in it.
 *
 * VERSIFICATION. Both translations follow the Protestant 66 book KJV
 * versification, which is what plan authoring is pinned to. Known divergences
 * (Psalm superscriptions, 3 John 14/15, some Malachi and Joel chapter
 * divisions) are an accepted v1 limitation.
 */
import 'dotenv/config';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { inflateRawSync } from 'zlib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CACHE_DIR = join(__dirname, '..', 'prisma', '.scripture-cache');

interface Source {
  code: string;
  name: string;
  url: string;
  file: string;
  /** SHA-256 of the downloaded artefact, pinned so an upstream change is loud. */
  sha256: string;
  isDefault: boolean;
}

const SOURCES: Source[] = [
  {
    code: 'WEB',
    name: 'World English Bible',
    url: 'https://ebible.org/Scriptures/engwebp_vpl.zip',
    file: 'engwebp_vpl.zip',
    sha256: 'f08d13b4f0701108f7b9f95d57c201649f37c36359f707c8cf1876538a84d750',
    // Modern English, and the default a member reads unless they choose otherwise.
    isDefault: true,
  },
  {
    code: 'KJV',
    name: 'King James Version',
    url: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json',
    file: 'KJV.json',
    sha256: 'f0b09dc49dfb97bb84f03aae1fbf026485048c3cab31a7a41017e2d86ac1d11c',
    isDefault: false,
  },
];

/**
 * The 66 book canon in order. `vpl` is the three letter code ebible uses in the
 * verse per line format, which is close to OSIS but not identical (SOL for Song
 * of Solomon, JOE for Joel). Both are written out rather than derived from file
 * order, so a reordered source file fails loudly instead of shifting every book
 * by one.
 */
const BOOKS: { id: number; osis: string; vpl: string; name: string; short: string; testament: 'OT' | 'NT' }[] = [
  { id: 1, osis: 'Gen', vpl: 'GEN', name: 'Genesis', short: 'Gen', testament: 'OT' },
  { id: 2, osis: 'Exod', vpl: 'EXO', name: 'Exodus', short: 'Exod', testament: 'OT' },
  { id: 3, osis: 'Lev', vpl: 'LEV', name: 'Leviticus', short: 'Lev', testament: 'OT' },
  { id: 4, osis: 'Num', vpl: 'NUM', name: 'Numbers', short: 'Num', testament: 'OT' },
  { id: 5, osis: 'Deut', vpl: 'DEU', name: 'Deuteronomy', short: 'Deut', testament: 'OT' },
  { id: 6, osis: 'Josh', vpl: 'JOS', name: 'Joshua', short: 'Josh', testament: 'OT' },
  { id: 7, osis: 'Judg', vpl: 'JDG', name: 'Judges', short: 'Judg', testament: 'OT' },
  { id: 8, osis: 'Ruth', vpl: 'RUT', name: 'Ruth', short: 'Ruth', testament: 'OT' },
  { id: 9, osis: '1Sam', vpl: '1SA', name: '1 Samuel', short: '1 Sam', testament: 'OT' },
  { id: 10, osis: '2Sam', vpl: '2SA', name: '2 Samuel', short: '2 Sam', testament: 'OT' },
  { id: 11, osis: '1Kgs', vpl: '1KI', name: '1 Kings', short: '1 Kgs', testament: 'OT' },
  { id: 12, osis: '2Kgs', vpl: '2KI', name: '2 Kings', short: '2 Kgs', testament: 'OT' },
  { id: 13, osis: '1Chr', vpl: '1CH', name: '1 Chronicles', short: '1 Chr', testament: 'OT' },
  { id: 14, osis: '2Chr', vpl: '2CH', name: '2 Chronicles', short: '2 Chr', testament: 'OT' },
  { id: 15, osis: 'Ezra', vpl: 'EZR', name: 'Ezra', short: 'Ezra', testament: 'OT' },
  { id: 16, osis: 'Neh', vpl: 'NEH', name: 'Nehemiah', short: 'Neh', testament: 'OT' },
  { id: 17, osis: 'Esth', vpl: 'EST', name: 'Esther', short: 'Esth', testament: 'OT' },
  { id: 18, osis: 'Job', vpl: 'JOB', name: 'Job', short: 'Job', testament: 'OT' },
  { id: 19, osis: 'Ps', vpl: 'PSA', name: 'Psalms', short: 'Ps', testament: 'OT' },
  { id: 20, osis: 'Prov', vpl: 'PRO', name: 'Proverbs', short: 'Prov', testament: 'OT' },
  { id: 21, osis: 'Eccl', vpl: 'ECC', name: 'Ecclesiastes', short: 'Eccl', testament: 'OT' },
  { id: 22, osis: 'Song', vpl: 'SOL', name: 'Song of Solomon', short: 'Song', testament: 'OT' },
  { id: 23, osis: 'Isa', vpl: 'ISA', name: 'Isaiah', short: 'Isa', testament: 'OT' },
  { id: 24, osis: 'Jer', vpl: 'JER', name: 'Jeremiah', short: 'Jer', testament: 'OT' },
  { id: 25, osis: 'Lam', vpl: 'LAM', name: 'Lamentations', short: 'Lam', testament: 'OT' },
  { id: 26, osis: 'Ezek', vpl: 'EZE', name: 'Ezekiel', short: 'Ezek', testament: 'OT' },
  { id: 27, osis: 'Dan', vpl: 'DAN', name: 'Daniel', short: 'Dan', testament: 'OT' },
  { id: 28, osis: 'Hos', vpl: 'HOS', name: 'Hosea', short: 'Hos', testament: 'OT' },
  { id: 29, osis: 'Joel', vpl: 'JOE', name: 'Joel', short: 'Joel', testament: 'OT' },
  { id: 30, osis: 'Amos', vpl: 'AMO', name: 'Amos', short: 'Amos', testament: 'OT' },
  { id: 31, osis: 'Obad', vpl: 'OBA', name: 'Obadiah', short: 'Obad', testament: 'OT' },
  { id: 32, osis: 'Jonah', vpl: 'JON', name: 'Jonah', short: 'Jonah', testament: 'OT' },
  { id: 33, osis: 'Mic', vpl: 'MIC', name: 'Micah', short: 'Mic', testament: 'OT' },
  { id: 34, osis: 'Nah', vpl: 'NAH', name: 'Nahum', short: 'Nah', testament: 'OT' },
  { id: 35, osis: 'Hab', vpl: 'HAB', name: 'Habakkuk', short: 'Hab', testament: 'OT' },
  { id: 36, osis: 'Zeph', vpl: 'ZEP', name: 'Zephaniah', short: 'Zeph', testament: 'OT' },
  { id: 37, osis: 'Hag', vpl: 'HAG', name: 'Haggai', short: 'Hag', testament: 'OT' },
  { id: 38, osis: 'Zech', vpl: 'ZEC', name: 'Zechariah', short: 'Zech', testament: 'OT' },
  { id: 39, osis: 'Mal', vpl: 'MAL', name: 'Malachi', short: 'Mal', testament: 'OT' },
  { id: 40, osis: 'Matt', vpl: 'MAT', name: 'Matthew', short: 'Matt', testament: 'NT' },
  { id: 41, osis: 'Mark', vpl: 'MAR', name: 'Mark', short: 'Mark', testament: 'NT' },
  { id: 42, osis: 'Luke', vpl: 'LUK', name: 'Luke', short: 'Luke', testament: 'NT' },
  { id: 43, osis: 'John', vpl: 'JOH', name: 'John', short: 'John', testament: 'NT' },
  { id: 44, osis: 'Acts', vpl: 'ACT', name: 'Acts', short: 'Acts', testament: 'NT' },
  { id: 45, osis: 'Rom', vpl: 'ROM', name: 'Romans', short: 'Rom', testament: 'NT' },
  { id: 46, osis: '1Cor', vpl: '1CO', name: '1 Corinthians', short: '1 Cor', testament: 'NT' },
  { id: 47, osis: '2Cor', vpl: '2CO', name: '2 Corinthians', short: '2 Cor', testament: 'NT' },
  { id: 48, osis: 'Gal', vpl: 'GAL', name: 'Galatians', short: 'Gal', testament: 'NT' },
  { id: 49, osis: 'Eph', vpl: 'EPH', name: 'Ephesians', short: 'Eph', testament: 'NT' },
  { id: 50, osis: 'Phil', vpl: 'PHI', name: 'Philippians', short: 'Phil', testament: 'NT' },
  { id: 51, osis: 'Col', vpl: 'COL', name: 'Colossians', short: 'Col', testament: 'NT' },
  { id: 52, osis: '1Thess', vpl: '1TH', name: '1 Thessalonians', short: '1 Thess', testament: 'NT' },
  { id: 53, osis: '2Thess', vpl: '2TH', name: '2 Thessalonians', short: '2 Thess', testament: 'NT' },
  { id: 54, osis: '1Tim', vpl: '1TI', name: '1 Timothy', short: '1 Tim', testament: 'NT' },
  { id: 55, osis: '2Tim', vpl: '2TI', name: '2 Timothy', short: '2 Tim', testament: 'NT' },
  { id: 56, osis: 'Titus', vpl: 'TIT', name: 'Titus', short: 'Titus', testament: 'NT' },
  { id: 57, osis: 'Phlm', vpl: 'PHM', name: 'Philemon', short: 'Phlm', testament: 'NT' },
  { id: 58, osis: 'Heb', vpl: 'HEB', name: 'Hebrews', short: 'Heb', testament: 'NT' },
  { id: 59, osis: 'Jas', vpl: 'JAM', name: 'James', short: 'Jas', testament: 'NT' },
  { id: 60, osis: '1Pet', vpl: '1PE', name: '1 Peter', short: '1 Pet', testament: 'NT' },
  { id: 61, osis: '2Pet', vpl: '2PE', name: '2 Peter', short: '2 Pet', testament: 'NT' },
  { id: 62, osis: '1John', vpl: '1JO', name: '1 John', short: '1 John', testament: 'NT' },
  { id: 63, osis: '2John', vpl: '2JO', name: '2 John', short: '2 John', testament: 'NT' },
  { id: 64, osis: '3John', vpl: '3JO', name: '3 John', short: '3 John', testament: 'NT' },
  { id: 65, osis: 'Jude', vpl: 'JUD', name: 'Jude', short: 'Jude', testament: 'NT' },
  { id: 66, osis: 'Rev', vpl: 'REV', name: 'Revelation', short: 'Rev', testament: 'NT' },
];

interface ParsedVerse {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
}

/** verseId = bookId * 1000000 + chapter * 1000 + verse. */
export function toVerseId(bookId: number, chapter: number, verse: number): number {
  return bookId * 1_000_000 + chapter * 1_000 + verse;
}

function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // The column is SMALLINT. No verse comes near 32767 words, but clamp rather
  // than let one malformed line abort a 31,000 row insert.
  return Math.min(words, 32_000);
}

/**
 * Reads a single named entry out of a ZIP archive.
 *
 * Written out rather than pulled in as a dependency: the backend has no zip
 * library, and a seed script is a poor reason to add one. Handles the two
 * compression methods a text archive uses, stored and deflate.
 */
function readFromZip(zip: Buffer, wantedName: string): string {
  // Walk local file headers from the start. Signature 0x04034b50.
  let offset = 0;
  while (offset < zip.length - 4) {
    if (zip.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = zip.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const dataStart = nameStart + nameLength + extraLength;

    if (name === wantedName) {
      const data = zip.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return data.toString('utf8');
      if (method === 8) return inflateRawSync(data).toString('utf8');
      throw new Error(`Unsupported zip compression method ${method} for ${name}`);
    }

    offset = dataStart + compressedSize;
  }
  throw new Error(`${wantedName} not found in the archive`);
}

/** ebible verse per line: "GEN 1:1 In the beginning, God created ..." */
function parseVpl(text: string): ParsedVerse[] {
  const byVplCode = new Map(BOOKS.map((b) => [b.vpl, b.id]));
  const verses: ParsedVerse[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([0-9A-Z]{3})\s+(\d+):(\d+)\s+(.*)$/);
    if (!match) continue;

    const bookId = byVplCode.get(match[1]);
    // Anything outside the 66 book canon is skipped on purpose: the archive can
    // carry front matter and the deuterocanon, and neither belongs here.
    if (!bookId) continue;

    const body = match[4].trim();
    if (!body) continue;
    verses.push({ bookId, chapter: Number(match[2]), verse: Number(match[3]), text: body });
  }

  return verses;
}

/** scrollmapper JSON: { books: [ { chapters: [ { verses: [...] } ] } ] } */
function parseScrollmapper(json: string): ParsedVerse[] {
  const parsed = JSON.parse(json) as {
    books: { chapters: { chapter: number; verses: { verse: number; text: string }[] }[] }[];
  };

  if (parsed.books.length !== 66) {
    throw new Error(`Expected 66 books in the source, found ${parsed.books.length}`);
  }

  const verses: ParsedVerse[] = [];
  parsed.books.forEach((book, index) => {
    const bookId = index + 1;
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const text = verse.text.trim();
        if (text) verses.push({ bookId, chapter: chapter.chapter, verse: verse.verse, text });
      }
    }
  });
  return verses;
}

async function download(source: Source): Promise<Buffer> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = join(CACHE_DIR, source.file);

  if (!existsSync(path)) {
    process.stdout.write(`  downloading ${source.code} from ${source.url}\n`);
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`${source.url} responded ${response.status}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }

  const buffer = readFileSync(path);
  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== source.sha256) {
    throw new Error(
      `Checksum mismatch for ${source.file}.\n  expected ${source.sha256}\n  found    ${digest}\n` +
        'The upstream source has changed. Verify the new file by hand and update the pinned ' +
        'checksum before re-running; plans already reference verse ranges in the current corpus.',
    );
  }
  return buffer;
}

async function seedBooks(chapterCounts: Map<number, number>) {
  for (const book of BOOKS) {
    const chapterCount = chapterCounts.get(book.id) ?? 0;
    await prisma.bibleBook.upsert({
      where: { id: book.id },
      create: {
        id: book.id,
        osisCode: book.osis,
        name: book.name,
        shortName: book.short,
        testament: book.testament,
        chapterCount,
      },
      update: { chapterCount },
    });
  }
}

async function seedTranslation(source: Source, verses: ParsedVerse[], force: boolean) {
  const translation = await prisma.bibleTranslation.upsert({
    where: { code: source.code },
    create: {
      code: source.code,
      name: source.name,
      licence: 'public-domain',
      isDefault: source.isDefault,
    },
    update: { name: source.name, isDefault: source.isDefault },
  });

  const existing = await prisma.bibleVerse.count({ where: { translationId: translation.id } });
  if (existing > 0 && !force) {
    console.log(`  ${source.code}: ${existing} verses already loaded, skipping. Use --force to re-ingest.`);
    return;
  }
  if (force && existing > 0) {
    await prisma.bibleVerse.deleteMany({ where: { translationId: translation.id } });
  }

  const rows = verses.map((v) => ({
    translationId: translation.id,
    verseId: toVerseId(v.bookId, v.chapter, v.verse),
    bookId: v.bookId,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text,
    wordCount: wordCount(v.text),
  }));

  const BATCH = 2_000;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.bibleVerse.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true });
    process.stdout.write(`\r  ${source.code}: ${Math.min(i + BATCH, rows.length)} / ${rows.length} verses`);
  }
  process.stdout.write('\n');
}

async function main() {
  const force = process.argv.includes('--force');
  const chapterCounts = new Map<number, number>();
  const parsedBySource = new Map<string, ParsedVerse[]>();

  for (const source of SOURCES) {
    const buffer = await download(source);
    const verses =
      source.file.endsWith('.zip')
        ? parseVpl(readFromZip(buffer, 'engwebp_vpl.txt'))
        : parseScrollmapper(buffer.toString('utf8'));

    if (verses.length < 30_000) {
      throw new Error(`${source.code} parsed only ${verses.length} verses, which cannot be right`);
    }
    parsedBySource.set(source.code, verses);

    for (const verse of verses) {
      const highest = chapterCounts.get(verse.bookId) ?? 0;
      if (verse.chapter > highest) chapterCounts.set(verse.bookId, verse.chapter);
    }
    console.log(`  ${source.code}: parsed ${verses.length} verses`);
  }

  await seedBooks(chapterCounts);
  console.log(`  books: ${BOOKS.length} seeded`);

  for (const source of SOURCES) {
    await seedTranslation(source, parsedBySource.get(source.code)!, force);
  }

  const total = await prisma.bibleVerse.count();
  console.log(`\nCorpus loaded: ${total} verses across ${SOURCES.length} translations.`);
}

main()
  .catch((err) => {
    console.error('\n' + (err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
