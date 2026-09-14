/**
 * Original schedules built from familiar reading patterns, not copied daily
 * schedules or licensed devotional material. Sources and rollout notes:
 * scripts/READING_PLANS.md. Importing this file never opens a database.
 */
import { ReadingTrack } from '@prisma/client';
import {
  cycleToAtLeast,
  estimateMinutes,
  formatReference,
  selectChapters,
  spreadAcrossDays,
  toPortionRanges,
  type BookSelection,
  type ChapterUnit,
} from './plan-generator';
import { readingIntensity } from './reading-intensity';

interface StreamPlan {
  label: string;
  selection: BookSelection[];
  /** Repeat the selection until it covers at least this many chapters. */
  cycleTo?: number;
  /** Repeat the selection exactly this many times. */
  repeat?: number;
}

export interface ReadingPlanTemplate {
  /** Bump to publish a correction while keeping existing subscriptions intact. */
  version?: number;
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
/** Every book in canonical order, for the cover-to-cover plans. */
const WHOLE_BIBLE: BookSelection[] = Array.from({ length: 66 }, (_, i) => ({ bookId: i + 1 }));
const OLD_TESTAMENT: BookSelection[] = Array.from({ length: 39 }, (_, i) => ({ bookId: i + 1 }));
const GOSPELS: BookSelection[] = Array.from({ length: 4 }, (_, i) => ({ bookId: i + 40 }));

/**
 * The specification's curated set is fifteen psalms, which leaves the 90 day
 * track nine chapters short of ninety. Rather than split a chapter or quietly
 * shorten the plan, the set is extended to twenty four psalms of the same
 * pastoral character. See the note in the report accompanying this commit.
 */
const NEW_BELIEVER_PSALMS = [
  1, 8, 16, 19, 23, 25, 27, 32, 34, 37, 40, 46, 51, 62, 63, 84, 90, 91, 100, 103, 121, 130, 139, 145,
];

export const READING_PLAN_TEMPLATES: ReadingPlanTemplate[] = [
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
    version: 2,
    title: 'Know the whole story',
    subtitle: (minutes) => `The New Testament with daily Psalms and Proverbs. One year, about ${minutes} minutes.`,
    description:
      'The whole New Testament at a steady pace, with the Psalms and Proverbs alongside it every single day.',
    track: ReadingTrack.GROWING,
    durationDays: 365,
    streams: [
      { label: 'New Testament', selection: NEW_TESTAMENT },
      {
        label: 'Wisdom',
        selection: [{ bookId: 19 }, { bookId: 20 }],
        cycleTo: 365,
      },
    ],
  },
  {
    slug: 'the-whole-counsel',
    version: 2,
    title: 'The whole counsel',
    subtitle: (minutes) =>
      `The entire Bible, Psalms and New Testament twice. One year, about ${minutes} minutes.`,
    description:
      'Inspired by the M’Cheyne reading pattern: the Old Testament once, the New Testament and Psalms twice in a year. This independently generated schedule balances whole chapters by length; the number of readings varies by day.',
    track: ReadingTrack.MATURE,
    durationDays: 365,
    streams: [
      { label: 'Old Testament', selection: OLD_TESTAMENT_SPINE },
      // Job through Malachi once, then the Psalms again, which is what makes
      // the Psalms twice a year.
      { label: 'Prophets and Writings', selection: [...OLD_TESTAMENT_REST, { bookId: 19 }] },
      { label: 'Gospels', selection: GOSPELS_AND_ACTS, repeat: 2 },
      { label: 'Epistles', selection: EPISTLES_AND_REVELATION, repeat: 2 },
    ],
  },
  // ── The familiar shapes ────────────────────────────────────────────────────
  // Plans anyone will recognise: whole books in canonical order at a set pace.
  // None copies a published plan's schedule. Each is the same generator run
  // over a different selection, balanced by real word counts.
  {
    slug: 'bible-in-a-year',
    title: 'The Bible in a year',
    subtitle: (minutes) => `Genesis to Revelation, in order. One year, about ${minutes} minutes a day.`,
    description:
      'The classic: every book in the order the Bible gives them, with readings balanced by word count where whole chapter lengths allow.',
    track: ReadingTrack.MATURE,
    durationDays: 365,
    streams: [{ label: 'Today', selection: WHOLE_BIBLE }],
  },
  {
    slug: 'old-testament-in-a-year',
    title: 'The Old Testament in a year',
    subtitle: (minutes) => `Genesis to Malachi, in order. One year, about ${minutes} minutes a day.`,
    description: 'The story before Jesus, all thirty nine books, at a steady pace through the year.',
    track: ReadingTrack.MATURE,
    durationDays: 365,
    streams: [{ label: 'Old Testament', selection: OLD_TESTAMENT }],
  },
  {
    slug: 'new-testament-in-90-days',
    title: 'The New Testament in 90 days',
    subtitle: (minutes, days) => `Matthew to Revelation in ${days} days, about ${minutes} minutes a day.`,
    description:
      'All twenty seven books in a season: long enough to take in, short enough to see the whole arc of it.',
    track: ReadingTrack.GROWING,
    durationDays: 90,
    streams: [{ label: 'New Testament', selection: NEW_TESTAMENT }],
  },
  {
    slug: 'psalms-in-30-days',
    title: 'The Psalms in 30 days',
    subtitle: (minutes) => `All 150 psalms in a month, about ${minutes} minutes a day.`,
    description:
      'The prayer book of the Bible, a few psalms at a time, balanced by length so a long psalm is not crammed into an already full day.',
    track: ReadingTrack.GROWING,
    durationDays: 30,
    streams: [{ label: 'Psalms', selection: [{ bookId: 19 }] }],
  },
  {
    slug: 'gospels-in-30-days',
    title: 'The Gospels in 30 days',
    subtitle: (minutes) => `Matthew, Mark, Luke and John in a month, about ${minutes} minutes a day.`,
    description:
      'The life of Jesus as four witnesses told it. A good month to begin with, and a good one to come back to.',
    track: ReadingTrack.NEW_BELIEVER,
    durationDays: 30,
    streams: [{ label: 'Gospels', selection: GOSPELS }],
  },
  {
    slug: 'proverbs-in-a-month',
    title: 'Proverbs in a month',
    subtitle: (minutes) => `One chapter a day for 31 days, about ${minutes} minutes a day.`,
    description:
      'The book of wisdom, a chapter a day. There are thirty one chapters, so you can start on any date and finish after 31 readings.',
    track: ReadingTrack.NEW_BELIEVER,
    durationDays: 31,
    streams: [{ label: 'Proverbs', selection: [{ bookId: 20 }] }],
  },
];

function canonicalPlan(
  slug: string,
  title: string,
  durationDays: number,
  selection: BookSelection[],
  description: string,
  track: ReadingTrack = ReadingTrack.GROWING,
): ReadingPlanTemplate {
  return {
    slug,
    title,
    durationDays,
    description,
    track,
    subtitle: (minutes, days) => `${days} readings, about ${minutes} minutes a day. Start any time.`,
    streams: [{ label: 'Today', selection }],
  };
}

READING_PLAN_TEMPLATES.push(
  canonicalPlan(
    'bible-in-90-days',
    'The Bible in 90 days',
    90,
    WHOLE_BIBLE,
    'An intensive journey from Genesis to Revelation. Set aside a longer daily reading time, or take each reading at your own pace.',
    ReadingTrack.MATURE,
  ),
  canonicalPlan(
    'bible-in-180-days',
    'The Bible in 180 days',
    180,
    WHOLE_BIBLE,
    'Read the whole Bible in six months, in book order. A focused daily commitment with room to pause when you need to.',
    ReadingTrack.MATURE,
  ),
  canonicalPlan(
    'bible-in-two-years',
    'The Bible in two years',
    730,
    WHOLE_BIBLE,
    'A slower journey through every book of the Bible, in order. Smaller daily readings leave time to reflect.',
  ),
  canonicalPlan(
    'new-testament-in-180-days',
    'The New Testament in 180 days',
    180,
    NEW_TESTAMENT,
    'Matthew to Revelation over six months. A gentler alternative to the 90 day plan, with the same complete coverage.',
  ),
  canonicalPlan(
    'new-testament-one-chapter-a-day',
    'The New Testament, one chapter a day',
    260,
    NEW_TESTAMENT,
    'All 260 New Testament chapters, one per reading. Read daily or choose five days a week to finish in 52 weeks.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'gospels-in-40-days',
    'The Gospels in 40 days',
    40,
    GOSPELS,
    'Spend 40 days with Matthew, Mark, Luke and John, following the life, teaching, death and resurrection of Jesus.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'gospels-one-chapter-a-day',
    'The Gospels, one chapter a day',
    89,
    GOSPELS,
    'The same four Gospels at an unhurried pace: 89 chapters over 89 readings, with time to reflect on Jesus each day.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'psalms-one-a-day',
    'The Psalms, one a day',
    150,
    [{ bookId: 19 }],
    'A daily Psalm for prayer and reflection. Read all 150 in order; longer Psalms naturally take more time.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'john-in-21-days',
    'John in 21 days',
    21,
    [{ bookId: 43 }],
    'Meet Jesus in the Gospel of John, one chapter a day. A short plan for beginning or renewing a daily reading habit.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'acts-in-28-days',
    'Acts in 28 days',
    28,
    [{ bookId: 44 }],
    'Follow the first believers and the spread of the good news, one chapter of Acts each day.',
    ReadingTrack.NEW_BELIEVER,
  ),
  canonicalPlan(
    'wisdom-in-60-days',
    'Psalms and Proverbs in 60 days',
    60,
    [{ bookId: 19 }, { bookId: 20 }],
    'Read all the Psalms, then Proverbs, over two months. A daily space for prayer, worship and practical wisdom.',
  ),
);

export interface ReadingPlanCorpus {
  chaptersByBook: Map<number, ChapterUnit[]>;
  bookNames: Map<number, string>;
}

export interface GeneratedPlanDay {
  dayIndex: number;
  referenceLabel: string;
  totalWordCount: number;
  estimatedMinutes: number;
  portions: {
    sequence: number;
    label: string;
    startVerseId: number;
    endVerseId: number;
    wordCount: number;
  }[];
}

/** Pure generation also used by tests and dry runs; no persistence or random IDs. */
export function buildReadingPlan(spec: ReadingPlanTemplate, corpus: ReadingPlanCorpus) {
  const streamDays = spec.streams.map((stream) => {
    let units = selectChapters(stream.selection, corpus.chaptersByBook);
    if (stream.repeat) units = Array.from({ length: stream.repeat }, () => units).flat();
    if (stream.cycleTo) units = cycleToAtLeast(units, stream.cycleTo);
    return { label: stream.label, days: spreadAcrossDays(units, spec.durationDays) };
  });

  const days: GeneratedPlanDay[] = [];
  let totalWordCount = 0;
  for (let dayIndex = 1; dayIndex <= spec.durationDays; dayIndex += 1) {
    const portions: GeneratedPlanDay['portions'] = [];
    const labelUnits: ChapterUnit[] = [];
    for (const stream of streamDays) {
      const units = stream.days[dayIndex - 1];
      labelUnits.push(...units);
      for (const range of toPortionRanges(units)) {
        portions.push({ ...range, sequence: portions.length + 1, label: stream.label });
      }
    }
    if (portions.length === 0) {
      throw new Error(`${spec.slug} day ${dayIndex} has no reading. Widen a stream or shorten the plan.`);
    }
    const dayWords = portions.reduce((sum, portion) => sum + portion.wordCount, 0);
    totalWordCount += dayWords;
    days.push({
      dayIndex,
      referenceLabel: formatReference(labelUnits, corpus.bookNames),
      totalWordCount: dayWords,
      estimatedMinutes: estimateMinutes(dayWords),
      portions,
    });
  }
  const avgMinutesPerDay = estimateMinutes(Math.round(totalWordCount / spec.durationDays));
  return {
    days,
    totalWordCount,
    avgMinutesPerDay,
    intensity: readingIntensity(avgMinutesPerDay),
  };
}

