/**
 * The rules of a class, as pure functions so they are tested on their own:
 * who is eligible, which cohort a learner is placed in, when a lesson counts as
 * complete, how a quiz is graded, and when someone has stalled.
 */

export const QUIZ_PASS_PCT = 60;
export const STALLED_AFTER_DAYS = 21;

/** A learner's summary of a lesson must be at least this many characters (spaces trimmed at the ends). */
export const MIN_SUMMARY_CHARS = 50;

export function summaryLongEnough(text: string | null | undefined): boolean {
  return (text ?? '').trim().length >= MIN_SUMMARY_CHARS;
}

export interface Eligibility {
  required: number;
  attended: number;
  eligible: boolean;
  remaining: number;
}

/** Sunday check-ins plus any Sundays an admin credited when the account was made. */
export function eligibility(required: number | null | undefined, sundayCheckins: number, credited: number): Eligibility {
  const need = Math.max(0, required ?? 0);
  const attended = Math.max(0, sundayCheckins) + Math.max(0, credited);
  return { required: need, attended, eligible: attended >= need, remaining: Math.max(0, need - attended) };
}

export interface CohortChoice {
  id: string;
  startsOn: Date;
  status: string;
}

/**
 * The cohort to place a learner in. An eligible learner joins the earliest open
 * cohort that has not finished starting (started at most a week ago, so a late
 * joiner still catches the first session) or else the next one. A learner who is
 * not yet eligible joins the first open cohort starting after they will have
 * attended enough Sundays. Null means no suitable cohort exists yet.
 */
export function chooseCohort(cohorts: CohortChoice[], el: Eligibility, now: Date): CohortChoice | null {
  const day = 24 * 60 * 60 * 1000;
  const open = cohorts.filter((c) => c.status === 'OPEN').sort((a, b) => a.startsOn.getTime() - b.startsOn.getTime());
  const earliest = el.eligible ? new Date(now.getTime() - 7 * day) : new Date(now.getTime() + el.remaining * 7 * day);
  return open.find((c) => c.startsOn.getTime() >= earliest.getTime() - day / 2) ?? null;
}

export interface LessonRequirements {
  hasVideo: boolean;
  quizCount: number;
  hasReflection: boolean;
  hasAction: boolean;
}

export interface LessonState {
  videoDone: boolean;
  quizPassed: boolean;
  reflected: boolean;
  actionDone: boolean;
}

/** A lesson is complete when every part it actually has is done. */
export function lessonComplete(req: LessonRequirements, state: LessonState): boolean {
  return (
    (!req.hasVideo || state.videoDone) &&
    (req.quizCount === 0 || state.quizPassed) &&
    (!req.hasReflection || state.reflected) &&
    (!req.hasAction || state.actionDone)
  );
}

/** Grades answers against the correct indexes; answers never come from the client's copy of the key. */
export function gradeQuiz(correct: number[], answers: (number | null | undefined)[]) {
  const results = correct.map((c, i) => answers[i] === c);
  const right = results.filter(Boolean).length;
  const scorePct = correct.length ? Math.round((right / correct.length) * 100) : 100;
  return { results, right, total: correct.length, scorePct, passed: scorePct >= QUIZ_PASS_PCT };
}

/** A class is complete with every lesson done and enough in-person sessions attended. */
export function classComplete(totalLessons: number, completedLessons: number, minSessions: number, attendedSessions: number): boolean {
  return totalLessons > 0 && completedLessons >= totalLessons && attendedSessions >= Math.max(0, minSessions);
}

/** Active, its cohort under way, and nothing done for three weeks. */
export function isStalled(lastActivity: Date | null, startedAt: Date, now: Date, days = STALLED_AFTER_DAYS): boolean {
  const since = (lastActivity ?? startedAt).getTime();
  return now.getTime() - since >= days * 24 * 60 * 60 * 1000;
}
