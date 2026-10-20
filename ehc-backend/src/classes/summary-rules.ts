import { z } from 'zod';

/**
 * The rules for a learner's summary of a lesson. The same rules, with the same
 * numbers, are kept in the web app (lib/classes/summary-rules.ts) so the page can
 * show a live count; this file is the authority, and both are tested against
 * the same cases.
 */

export const SUMMARY_MIN_CHARS = 300;
export const SUMMARY_MAX_CHARS = 3000;
export const SUMMARY_MIN_WORDS = 40;
/** No single word may be more than this share of the summary. */
export const SUMMARY_MAX_WORD_SHARE = 0.3;

/** Asked of every lesson that has no question of its own. */
export const DEFAULT_SUMMARY_PROMPT = 'What did you learn in this lesson, and how will you apply it this week?';

export type SummaryProblem = 'too_short' | 'too_long' | 'too_thin';

/** Repeated spaces, tabs and line breaks count as one space; the ends are trimmed. */
export function normalizeSummary(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function words(normalized: string): string[] {
  // A word is what sits between spaces and punctuation. Written without Unicode property escapes so it
  // builds for every browser target, and kept identical to the server's rule.
  return normalized
    .toLowerCase()
    .split(/[\s.,;:!?"\u201C\u201D()[\]{}\u2026\u2014\u2013/\\]+/)
    .filter(Boolean);
}

export function summaryProblem(text: string): SummaryProblem | null {
  const normalized = normalizeSummary(text);
  if (normalized.length < SUMMARY_MIN_CHARS) return 'too_short';
  if (normalized.length > SUMMARY_MAX_CHARS) return 'too_long';
  const list = words(normalized);
  if (list.length < SUMMARY_MIN_WORDS) return 'too_thin';
  const counts = new Map<string, number>();
  let most = 0;
  for (const w of list) {
    const n = (counts.get(w) ?? 0) + 1;
    counts.set(w, n);
    if (n > most) most = n;
  }
  if (most / list.length > SUMMARY_MAX_WORD_SHARE) return 'too_thin';
  return null;
}

export const SUMMARY_MESSAGES: Record<SummaryProblem, string> = {
  too_short: `Write at least ${SUMMARY_MIN_CHARS} characters about what you learnt.`,
  too_long: `Keep your summary under ${SUMMARY_MAX_CHARS} characters.`,
  too_thin: 'Please write a little more about what you learnt.',
};

/** Accepts a summary and returns the text as written, trimmed. */
export const summarySchema = z.string().superRefine((text, ctx) => {
  const problem = summaryProblem(text);
  if (problem) ctx.addIssue({ code: 'custom', message: SUMMARY_MESSAGES[problem] });
});
