/**
 * Which requests the audit trail keeps, and what of their body it keeps.
 *
 * Every change a signed-in person makes through the API is kept (POST, PUT,
 * PATCH, DELETE), except the routes below. Those are a person's own reading,
 * listening and progress, or steps that are not changes on their own (an
 * upload link, a preview), or public forms that are already stored where they
 * belong. Routes are matched on their pattern, e.g. "/units/:unitId/messages/read".
 */

export const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const SKIP: RegExp[] = [
  /^\/auth\/(login|refresh|logout|recovery|forgot-password)/,
  /^\/ai\//,
  /^\/classes\/:slug\/lessons\//,
  /^\/sermons\/me\//,
  /^\/sermons\/(:id\/play|subscribers|publish-scheduled|audio-upload-url|upload-audio)$/,
  /^\/articles\/:id\/(like|bookmark)$/,
  /^\/articles\/cover$/,
  /^\/members\/:id\/like$/,
  /^\/members\/me\/(avatar|cover)$/,
  /^\/notifications\//,
  /^\/push\//,
  /^\/units\/:unitId\/messages\/read$/,
  /^\/me\/reading-plan\//,
  /^\/books\/me\/:id\/read$/,
  /^\/calendar\//,
  /^\/attendance\/check-in$/,
  /^\/online-attendance\//,
  /^\/emails\/recipients\/preview$/,
  /^\/message-templates\/:key\/preview$/,
  /^\/cms\/pages\/:key\/preview-token$/,
  /\/upload-url$/,
  /^\/uploads\//,
  /^\/evangelism\/testimonies\/photo$/,
  /\/reactions$/,
  /^\/community\/posts\/:id\/react$/,
  /^\/giving\/webhook$/,
  /^\/email\/unsubscribe$/,
  /^\/public\//,
  /^\/pledges\/:campaign\/(public|track)/,
  /^\/events\/:slug\/rsvp/,
  /^\/prayer-watch\/signup$/,
  /^\/forms\/(contact|prayer-request|question|register|salvation|serve-team|testimony|welfare-request)$/,
  /^\/evangelism\/form$/,
];

/** Kept as an action, without what was written: private messages, pastoral notes, reflections. */
const PRIVATE_BODY: RegExp[] = [
  /^\/units\/:unitId\/messages/,
  /^\/follow-up\/notes\//,
  /^\/evangelism\/notes\//,
  /^\/prayer-watch\/mine\//,
  /^\/members\/me\/profile-details$/,
  /^\/one-on-one\/requests/,
  /^\/members\/:id\/comments/,
  /^\/members\/me\/birthday-greetings/,
];

export function skipRoute(route: string): boolean {
  return SKIP.some((r) => r.test(route));
}

export function bodyIsPrivate(route: string): boolean {
  return PRIVATE_BODY.some((r) => r.test(route));
}

const SECRET_KEY = /(pass(word)?|token|secret|otp|^pin$|signature|authorization|cookie|api_?key)/i;
/** Prayer requests stay out of the trail, as they stay out of the first-timer delete copy. */
const PRAYER_KEY = /^prayer/i;
const MAX_STRING = 500;
const MAX_ITEMS = 25;
const MAX_KEYS = 40;
const MAX_DEPTH = 4;
const MAX_JSON = 20_000;

function clean(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (depth >= MAX_DEPTH) return '…';
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((v) => clean(v, depth + 1));
    if (value.length > MAX_ITEMS) items.push(`…and ${value.length - MAX_ITEMS} more`);
    return items;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS)) {
      if (SECRET_KEY.test(key)) out[key] = '[hidden]';
      else if (PRAYER_KEY.test(key)) out[key] = '[private]';
      else out[key] = clean(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

/** What of a request body goes into the trail: secrets hidden, long text and lists cut short. */
export function sanitizeBody(body: unknown): unknown {
  if (body === null || body === undefined) return null;
  if (typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 0) return null;
  const cleaned = clean(body, 0);
  if (JSON.stringify(cleaned).length <= MAX_JSON) return cleaned;
  const keys = typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];
  return { note: 'Too large to keep in full', fields: keys.slice(0, MAX_KEYS) };
}

/** "Create a department (ADMIN+)" → "Create a department"; "Delete X for good; a copy…" → "Delete X for good". */
export function cleanSummary(summary: string | undefined, method: string, route: string): string {
  if (!summary) return `${method} ${route}`;
  let s = summary.split(/ — |; |\. /)[0];
  for (let i = 0; i < 3; i++) s = s.replace(/\s*\([^()]*\)\s*$/, '');
  return s.trim() || summary;
}
