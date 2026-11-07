/** Matches the DTO, so the server never has to reject something the form allowed. */
export const TITLE_MIN = 3;
export const TITLE_MAX = 160;
export const SUBTITLE_MAX = 200;
export const BODY_MIN = 20;
export const BODY_MAX = 40_000;

export function validateArticle(title: string, body: string): string | null {
  if (title.trim().length < TITLE_MIN) return "Give it a title of at least three characters.";
  if (title.trim().length > TITLE_MAX) return `The title is longer than ${TITLE_MAX} characters.`;
  if (body.trim().length < BODY_MIN) return "Write a little more before saving: at least a couple of sentences.";
  if (body.length > BODY_MAX) return "This is longer than the editor can hold. Try splitting it in two.";
  return null;
}

/** The Bible passage a story is about. */
export interface Scripture {
  label: string;
  startVerseId?: number;
  endVerseId?: number;
}

/** A copy of the words kept on this device while writing. */
export interface LocalDraft {
  title: string;
  subtitle: string;
  body: string;
  coverImageUrl: string | null;
  savedAt: number;
}

const LOCAL_PREFIX = "ehc.article-draft.";

export function readLocal(key: string): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_PREFIX + key);
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

export function writeLocal(key: string, draft: LocalDraft | null) {
  try {
    if (draft) window.localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(draft));
    else window.localStorage.removeItem(LOCAL_PREFIX + key);
  } catch {
    // Storage full or blocked: the server copy is still the safe one.
  }
}

export function readingStats(body: string) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
