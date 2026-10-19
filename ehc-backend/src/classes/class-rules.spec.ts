import { chooseCohort, classComplete, eligibility, gradeQuiz, isStalled, lessonComplete, summaryLongEnough, MIN_SUMMARY_CHARS } from './class-rules';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-14T12:00:00Z');
const at = (days: number) => new Date(now.getTime() + days * day);

describe('eligibility', () => {
  it('adds credited Sundays to check-ins', () => {
    expect(eligibility(4, 1, 2)).toEqual({ required: 4, attended: 3, eligible: false, remaining: 1 });
    expect(eligibility(4, 2, 2)).toMatchObject({ eligible: true, remaining: 0 });
  });

  it('treats no requirement as eligible', () => {
    expect(eligibility(null, 0, 0)).toMatchObject({ eligible: true, required: 0 });
  });
});

describe('chooseCohort', () => {
  const cohorts = [
    { id: 'closed', startsOn: at(1), status: 'CLOSED' },
    { id: 'old', startsOn: at(-30), status: 'OPEN' },
    { id: 'recent', startsOn: at(-5), status: 'OPEN' },
    { id: 'next', startsOn: at(20), status: 'OPEN' },
    { id: 'later', startsOn: at(60), status: 'OPEN' },
  ];

  it('places an eligible learner in a cohort that started this past week', () => {
    expect(chooseCohort(cohorts, eligibility(4, 4, 0), now)?.id).toBe('recent');
  });

  it('places a learner short of Sundays in the first cohort after they qualify', () => {
    expect(chooseCohort(cohorts, eligibility(4, 2, 0), now)?.id).toBe('next');
    expect(chooseCohort(cohorts, eligibility(8, 0, 0), now)?.id).toBe('later');
  });

  it('returns null when no open cohort fits', () => {
    expect(chooseCohort([{ id: 'old', startsOn: at(-30), status: 'OPEN' }], eligibility(4, 4, 0), now)).toBeNull();
  });
});

describe('lessonComplete', () => {
  const all = { hasVideo: true, quizCount: 3, hasReflection: true, hasAction: true };
  const done = { videoDone: true, quizPassed: true, reflected: true, actionDone: true };

  it('needs every part the lesson has', () => {
    expect(lessonComplete(all, done)).toBe(true);
    expect(lessonComplete(all, { ...done, quizPassed: false })).toBe(false);
  });

  it('ignores parts the lesson does not have', () => {
    expect(lessonComplete({ hasVideo: true, quizCount: 0, hasReflection: false, hasAction: false }, { ...done, quizPassed: false, reflected: false, actionDone: false })).toBe(true);
  });
});

describe('gradeQuiz', () => {
  it('passes at 60 percent', () => {
    expect(gradeQuiz([0, 1, 2, 3, 0], [0, 1, 2, null, 1])).toMatchObject({ right: 3, total: 5, scorePct: 60, passed: true });
    expect(gradeQuiz([0, 1, 2], [0, 0, 0])).toMatchObject({ right: 1, scorePct: 33, passed: false });
  });

  it('reports each question right or wrong', () => {
    expect(gradeQuiz([1, 2], [1, 0]).results).toEqual([true, false]);
  });
});

describe('classComplete', () => {
  it('needs all lessons and the minimum sessions', () => {
    expect(classComplete(20, 20, 3, 3)).toBe(true);
    expect(classComplete(20, 20, 3, 2)).toBe(false);
    expect(classComplete(20, 19, 0, 0)).toBe(false);
    expect(classComplete(0, 0, 0, 0)).toBe(false);
  });
});

describe('isStalled', () => {
  it('stalls after three weeks without progress', () => {
    expect(isStalled(at(-22), at(-40), now)).toBe(true);
    expect(isStalled(at(-10), at(-40), now)).toBe(false);
    expect(isStalled(null, at(-25), now)).toBe(true);
  });
});

describe('summaryLongEnough', () => {
  it('needs the minimum number of characters once trimmed', () => {
    expect(summaryLongEnough('a'.repeat(MIN_SUMMARY_CHARS))).toBe(true);
    expect(summaryLongEnough('a'.repeat(MIN_SUMMARY_CHARS - 1))).toBe(false);
    expect(summaryLongEnough(`   ${'a'.repeat(MIN_SUMMARY_CHARS - 1)}   `)).toBe(false);
    expect(summaryLongEnough(null)).toBe(false);
  });
});
