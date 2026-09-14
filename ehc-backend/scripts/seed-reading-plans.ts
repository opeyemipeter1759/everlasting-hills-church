/**
 * Publish global templates without replacing existing plan versions.
 *
 *   npx ts-node --transpile-only scripts/seed-reading-plans.ts --list
 *   npx ts-node --transpile-only scripts/seed-reading-plans.ts --dry-run
 *   npx ts-node --transpile-only scripts/seed-reading-plans.ts
 *
 * --list is offline. --dry-run reads the corpus but never writes. Existing
 * versions always remain untouched, including subscriptions and progress.
 * Corrections use explicit versions in reading-plan-templates.ts.
 * See READING_PLANS.md and prisma/MIGRATIONS.md before an operator runs seeds.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient, PlanStatus } from '@prisma/client';
import {
  READING_PLAN_TEMPLATES,
  buildReadingPlan,
  type ReadingPlanCorpus,
  type ReadingPlanTemplate,
} from '../src/reading-plan/reading-plan-templates';
import type { ChapterUnit } from '../src/reading-plan/plan-generator';

async function loadCorpus(prisma: PrismaClient): Promise<ReadingPlanCorpus> {
  const translation = await prisma.bibleTranslation.findFirst({ where: { isDefault: true } });
  if (!translation) throw new Error('No default translation. Run scripts/seed-scripture.ts first.');

  const rows = await prisma.$queryRaw<ChapterUnit[]>`
    SELECT "bookId", "chapter",
           MIN("verseId")::int AS "startVerseId",
           MAX("verseId")::int AS "endVerseId",
           SUM("wordCount")::int AS "wordCount"
    FROM "BibleVerse"
    WHERE "translationId" = ${translation.id}
    GROUP BY "bookId", "chapter"
    ORDER BY "bookId", "chapter"
  `;
  const chaptersByBook = new Map<number, ChapterUnit[]>();
  for (const row of rows) {
    const list = chaptersByBook.get(row.bookId) ?? [];
    list.push(row);
    chaptersByBook.set(row.bookId, list);
  }
  const books = await prisma.bibleBook.findMany({ select: { id: true, name: true } });
  return {
    chaptersByBook,
    bookNames: new Map(books.map((book) => [book.id, book.id === 19 ? 'Psalm' : book.name])),
  };
}

export async function publishReadingPlan(
  prisma: PrismaClient,
  spec: ReadingPlanTemplate,
  corpus: ReadingPlanCorpus,
  dryRun = false,
): Promise<'skipped' | 'previewed' | 'published'> {
  const version = spec.version ?? 1;
  const existing = await prisma.readingPlan.findFirst({
    where: { tenantId: null, slug: spec.slug, version },
    select: { id: true },
  });
  if (existing) {
    console.log(`  ${spec.slug} v${version}: already exists; subscriptions and readings unchanged.`);
    return 'skipped';
  }

  const generated = buildReadingPlan(spec, corpus);
  const portionCount = generated.days.reduce((sum, day) => sum + day.portions.length, 0);
  console.log(
    `  ${spec.slug} v${version}: ${generated.days.length} days, ${portionCount} portions, ` +
      `${generated.totalWordCount.toLocaleString()} words, about ${generated.avgMinutesPerDay} min/day ` +
      `(${generated.intensity})${dryRun ? ' [dry run]' : ''}`,
  );
  if (dryRun) return 'previewed';

  // One transaction prevents partial plans; old versions stay readable.
  const planId = randomUUID();
  const days = generated.days.map(({ portions, ...day }) => ({
    ...day,
    id: randomUUID(),
    planId,
    tenantId: null,
  }));
  const portions = generated.days.flatMap((day, index) =>
    day.portions.map((portion) => ({
      ...portion,
      id: randomUUID(),
      planDayId: days[index].id,
      tenantId: null,
    })),
  );

  await prisma.$transaction(async (tx) => {
    await tx.readingPlan.create({
      data: {
        id: planId,
        tenantId: null,
        slug: spec.slug,
        title: spec.title,
        subtitle: spec.subtitle(generated.avgMinutesPerDay, spec.durationDays),
        description: spec.description,
        track: spec.track,
        durationDays: spec.durationDays,
        avgMinutesPerDay: generated.avgMinutesPerDay,
        coverImageUrl: `/reading-plans/${spec.slug}.svg`,
        status: PlanStatus.DRAFT,
        version,
      },
    });
    await tx.readingPlanDay.createMany({ data: days });
    for (let index = 0; index < portions.length; index += 1_000) {
      await tx.readingPlanPortion.createMany({ data: portions.slice(index, index + 1_000) });
    }
    await tx.readingPlan.update({ where: { id: planId }, data: { status: PlanStatus.PUBLISHED } });
  }, { timeout: 60_000 });
  return 'published';
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes('--force')) {
    throw new Error('--force is no longer supported. Publish a new template version to preserve member progress.');
  }
  const unknown = args.find((arg) => !['--list', '--dry-run'].includes(arg));
  if (unknown) throw new Error(`Unknown argument: ${unknown}`);
  if (args.includes('--list')) {
    console.table(READING_PLAN_TEMPLATES.map(({ slug, durationDays, version }) => ({
      slug,
      durationDays,
      version: version ?? 1,
    })));
    return;
  }

  const prisma = new PrismaClient();
  try {
    const corpus = await loadCorpus(prisma);
    const results: string[] = [];
    for (const spec of READING_PLAN_TEMPLATES) {
      results.push(await publishReadingPlan(prisma, spec, corpus, args.includes('--dry-run')));
    }
    console.log(`${results.filter((result) => result === 'published').length} new versions published; ` +
      `${results.filter((result) => result === 'skipped').length} existing versions preserved.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
