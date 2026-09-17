/**
 * Exports the daily scripture rotation, with its text in every seeded
 * translation, for the website to serve on its own:
 *
 *   npx ts-node --transpile-only scripts/export-daily-scripture.ts
 *
 * The API is the source of the daily scripture, but the public homepage must
 * not go blank when the API is cold, down, or older than the website. The
 * website asks the API first and falls back to this file. The texts are public
 * domain and never change, so the file only needs regenerating when
 * DAILY_VERSES or the seeded translations change; a website test fails if the
 * rotation here and in verse-of-the-day.ts ever disagree.
 *
 * Reads the database named by DATABASE_URL in .env. Writes nothing to it.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { BiblePassageService } from '../src/reading-plan/services/bible-passage.service';
import { DAILY_VERSES, ROTATION_START, verseForDate } from '../src/reading-plan/verse-of-the-day';
import { SCRIPTURE_TIMEZONE } from '../src/reading-plan/services/daily-scripture.service';
import { toVerseId } from '../src/reading-plan/verse-id.util';

const OUTPUT = resolve(__dirname, '../../everlasting-hills-church/data/daily-scripture.json');

async function main() {
  const prisma = new PrismaClient();
  const passages = new BiblePassageService(prisma as never);
  try {
    const translations = (await passages.translations()).map(({ code, name, isDefault }) => ({
      code,
      name,
      isDefault,
    }));
    if (!translations.length) throw new Error('No translations are seeded');

    const verses = [];
    for (const ref of DAILY_VERSES) {
      const [book, chapter, from, to] = ref;
      const startVerseId = toVerseId(book, chapter, from);
      const endVerseId = toVerseId(book, chapter, to ?? from);
      const text: Record<string, string> = {};
      let reference = '';
      for (const { code } of translations) {
        const passage = await passages.passage({ translationCode: code, startVerseId, endVerseId });
        // The same completeness rule the API applies before quoting a verse.
        if (
          passage.verses.length !== endVerseId - startVerseId + 1 ||
          passage.verses.some((verse, index) => verse.verseId !== startVerseId + index || !verse.text.trim())
        ) {
          throw new Error(`${code} is missing text for ${passage.reference}`);
        }
        reference = passage.reference;
        text[code] = passage.verses.map((verse) => verse.text).join(' ');
      }
      verses.push({ ref: [...ref], reference, text });
    }

    // Sanity: the rotation index this file implies matches the API's own.
    const probe = '2026-09-16';
    const { index } = verseForDate(probe);
    console.log(`${probe} -> ${verses[index].reference}`);

    const file = { rotationStart: ROTATION_START, timezone: SCRIPTURE_TIMEZONE, translations, verses };
    writeFileSync(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${verses.length} verses in ${translations.map((t) => t.code).join(', ')} to ${OUTPUT}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
