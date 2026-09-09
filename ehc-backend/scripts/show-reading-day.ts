/**
 * Prints one day of a reading plan, with the actual scripture text.
 *
 *   npx ts-node --transpile-only scripts/show-reading-day.ts
 *   npx ts-node --transpile-only scripts/show-reading-day.ts start-with-jesus 1
 *   npx ts-node --transpile-only scripts/show-reading-day.ts the-whole-counsel 45 KJV
 *
 * This exists so a plan can be read by a person before any of it reaches a
 * screen. It walks the same path the API will: find the day, take its portions,
 * and resolve each verse range against the corpus with one predicate per
 * portion. If a day looks wrong here, it is wrong.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fromVerseId } from '../src/reading-plan/verse-id.util';

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2] ?? 'start-with-jesus';
  const dayIndex = Number(process.argv[3] ?? 1);
  const translationCode = process.argv[4];

  const plan = await prisma.readingPlan.findFirst({
    where: { tenantId: null, slug, version: 1 },
  });
  if (!plan) {
    const available = await prisma.readingPlan.findMany({
      where: { tenantId: null },
      select: { slug: true },
    });
    throw new Error(
      `No plan "${slug}". Available: ${available.map((p) => p.slug).join(', ') || 'none, run seed-reading-plans.ts'}`,
    );
  }

  const day = await prisma.readingPlanDay.findFirst({
    where: { planId: plan.id, dayIndex },
    include: { Portions: { orderBy: { sequence: 'asc' } } },
  });
  if (!day) throw new Error(`${slug} has no day ${dayIndex}. It runs 1 to ${plan.durationDays}.`);

  const translation = translationCode
    ? await prisma.bibleTranslation.findUnique({ where: { code: translationCode } })
    : await prisma.bibleTranslation.findFirst({ where: { isDefault: true } });
  if (!translation) throw new Error(`No translation ${translationCode ?? '(default)'}`);

  const books = await prisma.bibleBook.findMany({ select: { id: true, name: true } });
  const bookNames = new Map(books.map((b) => [b.id, b.id === 19 ? 'Psalm' : b.name]));

  console.log(`\n  ${plan.title}`);
  console.log(`  ${plan.subtitle}`);
  console.log(`\n  Day ${day.dayIndex} of ${plan.durationDays}: ${day.referenceLabel}`);
  console.log(`  ${day.totalWordCount.toLocaleString()} words, about ${day.estimatedMinutes} minutes, ${translation.code}\n`);

  for (const portion of day.Portions) {
    const verses = await prisma.bibleVerse.findMany({
      where: {
        translationId: translation.id,
        verseId: { gte: portion.startVerseId, lte: portion.endVerseId },
      },
      orderBy: { verseId: 'asc' },
    });

    const first = fromVerseId(portion.startVerseId);
    const last = fromVerseId(portion.endVerseId);
    const name = bookNames.get(first.bookId) ?? `Book ${first.bookId}`;
    const range =
      first.chapter === last.chapter
        ? `${name} ${first.chapter}`
        : `${name} ${first.chapter}-${last.chapter}`;

    console.log(`  ${portion.label}: ${range}  (${verses.length} verses)`);

    // The first few verses are enough to see that the range resolves to the
    // right text. The whole passage is what the reading screen will show.
    for (const verse of verses.slice(0, 4)) {
      const ref = fromVerseId(verse.verseId);
      console.log(`    ${ref.chapter}:${ref.verse}  ${verse.text}`);
    }
    if (verses.length > 4) console.log(`    ... ${verses.length - 4} more verses`);
    console.log('');
  }
}

main()
  .catch((err) => {
    console.error('\n' + (err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
