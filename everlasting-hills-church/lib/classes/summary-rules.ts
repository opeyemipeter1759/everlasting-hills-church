/**
 * The rules for a learner's summary of a lesson, as the page shows them.
 *
 * The server holds the same rules with the same numbers
 * (ehc-backend/src/classes/summary-rules.ts) and is the authority: this copy only
 * lets the page show a live count and enable the save button. Both are tested
 * against the same cases, so a change to one without the other fails a test.
 */

export const SUMMARY_MIN_CHARS = 300;
export const SUMMARY_MAX_CHARS = 3000;
export const SUMMARY_MIN_WORDS = 40;
/** No single word may be more than this share of the summary. */
export const SUMMARY_MAX_WORD_SHARE = 0.3;

export type SummaryProblem = "too_short" | "too_long" | "too_thin";

/** Repeated spaces, tabs and line breaks count as one space; the ends are trimmed. */
export function normalizeSummary(text: string): string {
  return text.replace(/\s+/g, " ").trim();
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
  if (normalized.length < SUMMARY_MIN_CHARS) return "too_short";
  if (normalized.length > SUMMARY_MAX_CHARS) return "too_long";
  const list = words(normalized);
  if (list.length < SUMMARY_MIN_WORDS) return "too_thin";
  const counts = new Map<string, number>();
  let most = 0;
  for (const w of list) {
    const n = (counts.get(w) ?? 0) + 1;
    counts.set(w, n);
    if (n > most) most = n;
  }
  if (most / list.length > SUMMARY_MAX_WORD_SHARE) return "too_thin";
  return null;
}
