import { z } from 'zod';

/**
 * The two questions put to Gemini about a service video, the JSON shapes it
 * must answer in, and zod checks for those answers (the model is asked for a
 * schema, but what comes back is still checked before it is saved).
 */

const CHURCH = 'Everlasting Hills Church (EHC), a charismatic evangelical church in Ibadan, Nigeria';

const FAITHFULNESS = `
Faithfulness rules — these override everything else:
- Use only what is said or shown in the video. Never invent, add, embellish or "improve" anything the preacher did not say.
- Never guess a name. If the preacher's name is not said or shown on screen, answer with an empty string.
- Bible references: list only passages actually read or quoted aloud (or shown on screen). Do not add related passages.
- Quotes must be the preacher's own words, as spoken. If you are not sure of the exact words, leave the quote empty.
`.trim();

// ─── Step 1: find the sermon in the whole service ──────────────────────────

/** The church's own video title: the most reliable spelling of the preacher's name. */
const titleLine = (videoTitle: string) =>
  `The church titled this video "${videoTitle}". When a name in the video matches a name in this title, spell it as the title does.`;

export const locatePrompt = (videoTitle: string) => `
This is a recorded church service from ${CHURCH}. ${titleLine(videoTitle)} A service contains praise and worship, prayers, announcements, testimonies, offering and a sermon.

Find the MAIN SERMON: the one message preached from the Bible by the main preacher. Worship, prayer sessions, announcements, testimonies, offering exhortations and altar calls after the message are NOT part of the sermon.

Answer with:
- "hasSermon": true only if the video contains a sermon.
- "sermonStartSeconds" / "sermonEndSeconds": where the sermon starts and ends, in whole seconds from the start of the video. Start when the preacher begins the message (after any handover), end when the message ends. Use 0 for both when there is no sermon.
- "preacher": the preacher's name exactly as said or shown on screen, or "" if it is not mentioned.
- "reason": one short sentence on what you found (e.g. "Sermon by Pastor X from 52:10 to 1:31:40" or "Worship session only, no preaching").

${FAITHFULNESS}
`.trim();

export const LOCATE_SCHEMA = {
  type: 'object',
  properties: {
    hasSermon: { type: 'boolean' },
    sermonStartSeconds: { type: 'integer' },
    sermonEndSeconds: { type: 'integer' },
    preacher: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['hasSermon', 'sermonStartSeconds', 'sermonEndSeconds', 'preacher', 'reason'],
};

export const locateAnswer = z.object({
  hasSermon: z.boolean(),
  sermonStartSeconds: z.number().int().min(0),
  sermonEndSeconds: z.number().int().min(0),
  preacher: z.string(),
  reason: z.string(),
});
export type LocateAnswer = z.infer<typeof locateAnswer>;

// ─── Step 2: summarise the sermon only ─────────────────────────────────────

export function digestPrompt(preacherHint: string, videoTitle: string): string {
  return `
This clip is the sermon from a church service at ${CHURCH}. ${titleLine(videoTitle)}${preacherHint ? ` The preacher was identified as "${preacherHint}".` : ''}

Answer with:
- "sermonTitle": the title as the preacher said it. If none was given, a short fitting title drawn from the preacher's own words.
- "preacher": the preacher's name as said or shown, or "".
- "bibleReferences": every Bible passage read or quoted, as references like "John 3:16" or "Romans 8:28-30", in the order they came.
- "summary": 5 to 7 sentences, faithful to what the preacher actually said, in plain warm English for church members.
- "keyPoints": exactly 3 key points the preacher made, one sentence each.
- "wordOfTheDay": one word or short phrase the preacher emphasised (e.g. "Grace", "Faithfulness", "Obedience"), with:
  - "word": the word or phrase.
  - "meaning": what it means, in simple language, as the preacher explained it.
  - "verse": { "reference", "text" } — a Bible verse from this sermon that goes with the word. "text" is the verse as it was read in the sermon; use "" if it was only referenced, not read.
  - "reflection": 2 to 3 sentences applying the preacher's teaching on this word to daily life. Apply what was taught; do not add new teaching.
  - "preacherQuote": a short quote from the preacher about this word, in their exact words, or "" if there isn't a clear one.
  - "confession": 2 to 4 short first-person declarations ("I am…", "I will…") a member can say out loud today, built only from the word, the verse and what the preacher taught.

${FAITHFULNESS}
`.trim();
}

const str = { type: 'string' };
export const DIGEST_SCHEMA = {
  type: 'object',
  properties: {
    sermonTitle: str,
    preacher: str,
    bibleReferences: { type: 'array', items: str },
    summary: str,
    keyPoints: { type: 'array', items: str },
    wordOfTheDay: {
      type: 'object',
      properties: {
        word: str,
        meaning: str,
        verse: { type: 'object', properties: { reference: str, text: str }, required: ['reference', 'text'] },
        reflection: str,
        preacherQuote: str,
        confession: { type: 'array', items: str },
      },
      required: ['word', 'meaning', 'verse', 'reflection', 'preacherQuote', 'confession'],
    },
  },
  required: ['sermonTitle', 'preacher', 'bibleReferences', 'summary', 'keyPoints', 'wordOfTheDay'],
};

const text = z.string().trim().min(1);
export const digestAnswer = z.object({
  sermonTitle: text,
  preacher: z.string().trim(),
  bibleReferences: z.array(text),
  summary: text,
  keyPoints: z.array(text).min(1).transform((points) => points.slice(0, 3)),
  wordOfTheDay: z.object({
    word: text,
    meaning: text,
    verse: z.object({ reference: z.string().trim(), text: z.string().trim() }),
    reflection: text,
    preacherQuote: z.string().trim(),
    confession: z.array(text).transform((lines) => lines.slice(0, 4)),
  }),
});
export type DigestAnswer = z.infer<typeof digestAnswer>;
export type WordOfTheDay = DigestAnswer['wordOfTheDay'];

// ─── Step 3: a confession for each day until the next service ──────────────

/** Fresh confessions written per sermon, one for each day after the service. */
export const DAILY_CONFESSION_DAYS = 6;

/**
 * Text only — no video. Works from what step 2 already drew out of the sermon,
 * so each day's confession is new wording on the same teaching, never new
 * teaching.
 */
export function dailyConfessionsPrompt(d: Pick<DigestAnswer, 'sermonTitle' | 'summary' | 'keyPoints' | 'bibleReferences' | 'wordOfTheDay'>): string {
  return `
These are notes from a sermon preached at ${CHURCH}.

Title: ${d.sermonTitle}
Summary: ${d.summary}
Key points:
${d.keyPoints.map((p) => `- ${p}`).join('\n')}
Bible passages read: ${d.bibleReferences.join('; ') || 'none listed'}
Word of the Day: ${d.wordOfTheDay.word} — ${d.wordOfTheDay.meaning}
Verse: ${d.wordOfTheDay.verse.reference}${d.wordOfTheDay.verse.text ? ` — "${d.wordOfTheDay.verse.text}"` : ''}
Today's confession (already used): ${d.wordOfTheDay.confession.join(' ')}

Members say a short confession out loud every day until the next service. Write ${DAILY_CONFESSION_DAYS} NEW confessions, one for each of the next ${DAILY_CONFESSION_DAYS} days, so the words change each day while the message stays this sermon's.

Answer with "confessions": an array of ${DAILY_CONFESSION_DAYS} confessions. Each confession is an array of 2 to 4 short first-person declarations ("I am…", "I will…", "I declare…") a member can say out loud.

Rules:
- Build every line only from the notes above: its key points, the Word of the Day, and the passages listed. Let each day lean on a different key point or passage.
- Do not repeat today's confession or another day's line word for word.
- Never add teaching, promises, or Bible references that are not in the notes.
- Plain, warm, confident English; no quotation marks; each line under 20 words.
`.trim();
}

export const DAILY_CONFESSIONS_SCHEMA = {
  type: 'object',
  properties: { confessions: { type: 'array', items: { type: 'array', items: str } } },
  required: ['confessions'],
};

export const dailyConfessionsAnswer = z.object({
  confessions: z
    .array(z.array(text).min(2).transform((lines) => lines.slice(0, 4)))
    .min(1)
    .transform((days) => days.slice(0, DAILY_CONFESSION_DAYS)),
});
