/**
 * Generates the three global reading plan templates.
 *
 *   npx ts-node --transpile-only scripts/seed-reading-plans.ts
 *   npx ts-node --transpile-only scripts/seed-reading-plans.ts --force
 *
 * These are templates with no tenant, published and ready for any church to
 * fork. Nothing here is hand authored: each track is declared as a selection of
 * books and generated against the real word counts in the corpus, so a day of
 * Psalm 119 never sits beside a day of Psalm 117 as though they were equals.
 *
 * Track names in the database are technical. The titles are pastoral, because
 * nobody selects "I am immature".
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient, PlanStatus, ReadingTrack } from '@prisma/client';
import {
  cycleToAtLeast,
  estimateMinutes,
  formatReference,
  selectChapters,
  spreadAcrossDays,
  toPortionRanges,
  type BookSelection,
  type ChapterUnit,
} from '../src/reading-plan/plan-generator';

const prisma = new PrismaClient();

interface StreamPlan {
  label: string;
  selection: BookSelection[];
  /** Repeat the selection until it covers at least this many chapters. */
  cycleTo?: number;
}

interface TrackSpec {
  slug: string;
  title: string;
  /**
   * Built from the generated average, never asserted ahead of it. The
   * specification promises "about 8 minutes a day" for a 90 day track whose
   * prescribed readings come to 653 words a day, which is three. Copy that
   * claims more than the readings hold is the same fault as a hardcoded
   * placeholder: it states something the data does not say.
   */
  subtitle: (minutes: number, days: number) => string;
  description: string;
  track: ReadingTrack;
  durationDays: number;
  streams: StreamPlan[];
}

const OLD_TESTAMENT_SPINE: BookSelection[] = Array.from({ length: 17 }, (_, i) => ({ bookId: i + 1 }));
const OLD_TESTAMENT_REST: BookSelection[] = Array.from({ length: 22 }, (_, i) => ({ bookId: i + 18 }));
const GOSPELS_AND_ACTS: BookSelection[] = Array.from({ length: 5 }, (_, i) => ({ bookId: i + 40 }));
const EPISTLES_AND_REVELATION: BookSelection[] = Array.from({ length: 22 }, (_, i) => ({ bookId: i + 45 }));
const NEW_TESTAMENT: BookSelection[] = Array.from({ length: 27 }, (_, i) => ({ bookId: i + 40 }));

/**
 * The specification's curated set is fifteen psalms, which leaves the 90 day
 * track nine chapters short of ninety. Rather than split a chapter or quietly
 * shorten the plan, the set is extended to twenty four psalms of the same
 * pastoral character. See the note in the report accompanying this commit.
 */
const NEW_BELIEVER_PSALMS = [
  1, 8, 16, 19, 23, 25, 27, 32, 34, 37, 40, 46, 51, 62, 63, 84, 90, 91, 100, 103, 121, 130, 139, 145,
];

const TRACKS: TrackSpec[] = [
  {
    slug: 'start-with-jesus',
    title: 'Start with Jesus',
    subtitle: (minutes, days) => `Meet him in the Gospels. ${days} days, about ${minutes} minutes a day.`,
    description:
      'A first walk through the life of Jesus and the church he began. John and Mark, the early days of Acts, a season in the Psalms, then Paul and John on what it means to follow him.',
    track: ReadingTrack.NEW_BELIEVER,
    durationDays: 90,
    streams: [
      {
        label: 'Today',
        selection: [
          { bookId: 43 }, // John
          { bookId: 41 }, // Mark
          { bookId: 44, fromChapter: 1, toChapter: 12 }, // Acts
          { bookId: 19, chapters: NEW_BELIEVER_PSALMS },
          { bookId: 50 }, // Philippians
          { bookId: 62 }, // 1 John
          { bookId: 45, fromChapter: 1, toChapter: 8 }, // Romans
        ],
      },
    ],
  },
  {
    slug: 'know-the-whole-story',
    title: 'Know the whole story',
    subtitle: (minutes) => `The New Testament with a Psalm each day. One year, about ${minutes} minutes.`,
    description:
      'The whole New Testament at a steady pace, with the Psalms and Proverbs alongside it every single day.',
    track: ReadingTrack.GROWING,
    durationDays: 365,
    streams: [
      { label: 'New Testament', selection: NEW_TESTAMENT },
      {
        label: 'Psalm',
        selection: [{ bookId: 19 }, { bookId: 20 }],
        cycleTo: 365,
      },
    ],
  },
  {
    slug: 'the-whole-counsel',
    title: 'The whole counsel',
    subtitle: (minutes) =>
      `The entire Bible, Psalms and New Testament twice. One year, about ${minutes} minutes.`,
    description:
      'The shape Robert Murray McCheyne set out in 1842: the Old Testament once, the New Testament and the Psalms twice, in four readings a day.',
    track: ReadingTrack.MATURE,
    durationDays: 365,
    streams: [
      { label: 'Old Testament', selection: OLD_TESTAMENT_SPINE },
      // Job through Malachi once, then the Psalms again, which is what makes
      // the Psalms twice a year.
      { label: 'Prophets and Writings', selection: [...OLD_TESTAMENT_REST, { bookId: 19 }] },
      { label: 'Gospels', selection: GOSPELS_AND_ACTS, cycleTo: 365 },
      { label: 'Epistles', selection: EPISTLES_AND_REVELATION, cycleTo: 365 },
    ],
  },
];

async function loadCorpus() {
  const translation = await prisma.bibleTranslation.findFirst({ where: { isDefault: true } });
  if (!translation) {
    throw new Error('No default translation. Run scripts/seed-scripture.ts first.');
  }

  const rows = await prisma.$queryRawUnsafe<
    { bookId: number; chapter: number; startVerseId: number; endVerseId: number; wordCount: number }[]
  >(`
    SELECT "bookId", "chapter",
           MIN("verseId")::int  AS "startVerseId",
           MAX("verseId")::int  AS "endVerseId",
           SUM("wordCount")::int AS "wordCount"
    FROM "BibleVerse"
    WHERE "translationId" = ${translation.id}
    GROUP BY "bookId", "chapter"
    ORDER BY "bookId", "chapter"
  `);

  const chaptersByBook = new Map<number, ChapterUnit[]>();
  for (const row of rows) {
    const list = chaptersByBook.get(row.bookId) ?? [];
    list.push(row);
    chaptersByBook.set(row.bookId, list);
  }

  const books = await prisma.bibleBook.findMany({ select: { id: true, name: true } });
  // Psalms reads better as "Psalm 23" than "Psalms 23" in a day label.
  const bookNames = new Map(books.map((b) => [b.id, b.id === 19 ? 'Psalm' : b.name]));

  return { chaptersByBook, bookNames };
}

async function generate(spec: TrackSpec, force: boolean) {
  const existing = await prisma.readingPlan.findFirst({
    where: { tenantId: null, slug: spec.slug, version: 1 },
  });

  if (existing && !force) {
    console.log(`  ${spec.slug}: already generated, skipping. Use --force to rebuild.`);
    return;
  }
  if (existing) {
    // Days and portions cascade. The trigger blocks edits to a published plan,
    // so a rebuild replaces the row rather than mutating it.
    await prisma.readingPlan.delete({ where: { id: existing.id } });
  }

  const { chaptersByBook, bookNames } = await loadCorpus();

  // Each stream is laid out across the same span of days independently, then
  // the day is assembled from whatever each stream contributes.
  const streamDays = spec.streams.map((stream) => {
    let units = selectChapters(stream.selection, chaptersByBook);
    if (stream.cycleTo) units = cycleToAtLeast(units, stream.cycleTo);
    return { label: stream.label, days: spreadAcrossDays(units, spec.durationDays) };
  });

  const planId = randomUUID();
  const days: {
    id: string;
    dayIndex: number;
    referenceLabel: string;
    totalWordCount: number;
    estimatedMinutes: number;
  }[] = [];
  const portions: {
    id: string;
    planDayId: string;
    sequence: number;
    label: string;
    startVerseId: number;
    endVerseId: number;
    wordCount: number;
  }[] = [];

  let planWords = 0;

  for (let dayIndex = 1; dayIndex <= spec.durationDays; dayIndex += 1) {
    const dayId = randomUUID();
    const contributions = streamDays
      .map((stream) => ({ label: stream.label, units: stream.days[dayIndex - 1] }))
      .filter((c) => c.units.length > 0);

    if (contributions.length === 0) {
      throw new Error(`${spec.slug} day ${dayIndex} has no reading. Widen a stream or shorten the plan.`);
    }

    let sequence = 1;
    let dayWords = 0;
    const labelUnits: ChapterUnit[] = [];

    for (const contribution of contributions) {
      labelUnits.push(...contribution.units);
      for (const range of toPortionRanges(contribution.units)) {
        portions.push({
          id: randomUUID(),
          planDayId: dayId,
          sequence: sequence++,
          label: contribution.label,
          startVerseId: range.startVerseId,
          endVerseId: range.endVerseId,
          wordCount: range.wordCount,
        });
        dayWords += range.wordCount;
      }
    }

    planWords += dayWords;
    days.push({
      id: dayId,
      dayIndex,
      referenceLabel: formatReference(labelUnits, bookNames),
      totalWordCount: dayWords,
      estimatedMinutes: estimateMinutes(dayWords),
    });
  }

  const avgMinutes = estimateMinutes(Math.round(planWords / spec.durationDays));

  await prisma.$transaction(async (tx) => {
    await tx.readingPlan.create({
      data: {
        id: planId,
        tenantId: null,
        slug: spec.slug,
        title: spec.title,
        subtitle: spec.subtitle(avgMinutes, spec.durationDays),
        description: spec.description,
        track: spec.track,
        durationDays: spec.durationDays,
        avgMinutesPerDay: avgMinutes,
        // Cover art ships with the frontend, one SVG per slug, generated by
        // everlasting-hills-church/scripts/generate-plan-artwork.mjs. A path
        // rather than an absolute URL, so it follows whichever host serves it.
        coverImageUrl: `/reading-plans/${spec.slug}.svg`,
        // Created as a draft so the immutability trigger does not fight the
        // insert of its own days, then published once it is whole.
        status: PlanStatus.DRAFT,
        version: 1,
      },
    });

    await tx.readingPlanDay.createMany({
      data: days.map((day) => ({ ...day, planId, tenantId: null })),
    });
    for (let i = 0; i < portions.length; i += 1_000) {
      await tx.readingPlanPortion.createMany({
        data: portions.slice(i, i + 1_000).map((p) => ({ ...p, tenantId: null })),
      });
    }

    await tx.readingPlan.update({ where: { id: planId }, data: { status: PlanStatus.PUBLISHED } });
  });

  console.log(
    `  ${spec.slug}: ${days.length} days, ${portions.length} portions, ` +
      `${planWords.toLocaleString()} words, about ${avgMinutes} minutes a day`,
  );
}

async function main() {
  const force = process.argv.includes('--force');
  for (const spec of TRACKS) {
    await generate(spec, force);
  }

  const plans = await prisma.readingPlan.count({ where: { tenantId: null } });
  console.log(`\n${plans} global templates published.`);
}

main()
  .catch((err) => {
    console.error('\n' + (err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
