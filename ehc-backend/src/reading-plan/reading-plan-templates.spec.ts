import { buildReadingPlan, READING_PLAN_TEMPLATES } from './reading-plan-templates';
import { readingIntensity } from './reading-intensity';
import { toVerseId } from './verse-id.util';
import type { ChapterUnit } from './plan-generator';

// The 66 book canon, independently specifying the complete 1,189 chapters.
// Deliberately uneven word counts exercise packing rather than equal chapters.
const CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8,
  66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16,
  13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22,
];
const corpus = {
  chaptersByBook: new Map<number, ChapterUnit[]>(CHAPTER_COUNTS.map((count, index) => [
    index + 1,
    Array.from({ length: count }, (_, chapter) => ({
      bookId: index + 1,
      chapter: chapter + 1,
      startVerseId: toVerseId(index + 1, chapter + 1, 1),
      endVerseId: toVerseId(index + 1, chapter + 1, 25),
      wordCount: 200 + ((chapter * 43 + index * 31) % 1_000),
    })),
  ])),
  bookNames: new Map(CHAPTER_COUNTS.map((_, index) => [index + 1, `Book ${index + 1}`])),
};

function generate(slug: string) {
  const spec = READING_PLAN_TEMPLATES.find((plan) => plan.slug === slug)!;
  return buildReadingPlan(spec, corpus);
}

function prescribedChapters(plan: ReturnType<typeof generate>) {
  return plan.days.flatMap((day) => day.portions.flatMap((portion) => {
    const book = Math.floor(portion.startVerseId / 1_000_000);
    const firstChapter = Math.floor((portion.startVerseId % 1_000_000) / 1_000);
    const lastChapter = Math.floor((portion.endVerseId % 1_000_000) / 1_000);
    expect(Math.floor(portion.endVerseId / 1_000_000)).toBe(book);
    expect(portion.startVerseId % 1_000).toBe(1);
    expect(portion.endVerseId % 1_000).toBe(25);
    expect(lastChapter).toBeGreaterThanOrEqual(firstChapter);
    return Array.from({ length: lastChapter - firstChapter + 1 }, (_, index) => `${book}:${firstChapter + index}`);
  }));
}

function allChapters(firstBook: number, lastBook: number) {
  return CHAPTER_COUNTS.flatMap((count, index) => index + 1 < firstBook || index + 1 > lastBook
    ? []
    : Array.from({ length: count }, (_, chapter) => `${index + 1}:${chapter + 1}`));
}

describe('reading plan templates', () => {
  it('offers twenty distinct plans across light, medium and intensive reading loads', () => {
    expect(new Set(READING_PLAN_TEMPLATES.map((plan) => plan.slug)).size).toBe(20);
    expect(new Set(READING_PLAN_TEMPLATES.map((plan) => generate(plan.slug).intensity)))
      .toEqual(new Set(['LOW', 'MEDIUM', 'HIGH']));
  });

  it.each(READING_PLAN_TEMPLATES)('$slug fills its entire duration with valid complete chapter readings', (spec) => {
    const plan = buildReadingPlan(spec, corpus);
    expect(plan.days).toHaveLength(spec.durationDays);
    expect(plan.days.map((day) => day.dayIndex)).toEqual(Array.from({ length: spec.durationDays }, (_, index) => index + 1));
    for (const day of plan.days) {
      expect(day.portions.length).toBeGreaterThan(0);
      expect(day.referenceLabel).not.toBe('');
      expect(day.totalWordCount).toBeGreaterThan(0);
    }
    prescribedChapters(plan);
  });

  it.each([
    ['bible-in-90-days', 1, 66],
    ['bible-in-180-days', 1, 66],
    ['bible-in-a-year', 1, 66],
    ['bible-in-two-years', 1, 66],
    ['old-testament-in-a-year', 1, 39],
    ['new-testament-in-90-days', 40, 66],
    ['new-testament-in-180-days', 40, 66],
    ['new-testament-one-chapter-a-day', 40, 66],
    ['gospels-in-30-days', 40, 43],
    ['gospels-in-40-days', 40, 43],
    ['gospels-one-chapter-a-day', 40, 43],
    ['psalms-in-30-days', 19, 19],
    ['psalms-one-a-day', 19, 19],
    ['proverbs-in-a-month', 20, 20],
    ['john-in-21-days', 43, 43],
    ['acts-in-28-days', 44, 44],
    ['wisdom-in-60-days', 19, 20],
  ] as const)('%s reads every advertised chapter exactly once, in order', (slug, firstBook, lastBook) => {
    expect(prescribedChapters(generate(slug))).toEqual(allChapters(firstBook, lastBook));
  });

  it.each(['proverbs-in-a-month', 'new-testament-one-chapter-a-day', 'gospels-one-chapter-a-day', 'psalms-one-a-day', 'john-in-21-days', 'acts-in-28-days'])('%s keeps its one chapter per reading promise', (slug) => {
    for (const day of generate(slug).days) {
      expect(day.portions).toHaveLength(1);
      expect(Math.floor(day.portions[0].startVerseId / 1_000))
        .toBe(Math.floor(day.portions[0].endVerseId / 1_000));
    }
  });

  it('reads the New Testament and Psalms exactly twice in the whole counsel, and other OT chapters once', () => {
    const counts = new Map<string, number>();
    for (const chapter of prescribedChapters(generate('the-whole-counsel'))) {
      counts.set(chapter, (counts.get(chapter) ?? 0) + 1);
    }
    expect(counts.size).toBe(1_189);
    for (const [chapter, count] of counts) {
      const book = Number(chapter.split(':')[0]);
      expect(count).toBe(book === 19 || book >= 40 ? 2 : 1);
    }
  });

  it('assigns lighter loads to slower versions of the same coverage', () => {
    expect(generate('bible-in-90-days').avgMinutesPerDay).toBeGreaterThan(generate('bible-in-180-days').avgMinutesPerDay);
    expect(generate('bible-in-180-days').avgMinutesPerDay).toBeGreaterThan(generate('bible-in-a-year').avgMinutesPerDay);
    expect(generate('bible-in-a-year').avgMinutesPerDay).toBeGreaterThan(generate('bible-in-two-years').avgMinutesPerDay);
  });
});

describe('reading intensity', () => {
  it.each([[1, 'LOW'], [5, 'LOW'], [6, 'MEDIUM'], [15, 'MEDIUM'], [16, 'HIGH'], [45, 'HIGH']] as const)('%s minutes is %s', (minutes, expected) => {
    expect(readingIntensity(minutes)).toBe(expected);
  });
  it.each([null, undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('does not invent intensity for %s minutes', (minutes) => {
    expect(readingIntensity(minutes)).toBeNull();
  });
});
