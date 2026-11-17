import type { Visitor } from '@prisma/client';

/**
 * The first-timer form's answer fields on the Visitor record, in form order.
 * Labels live with the form on the frontend (lib/first-timer/fields.ts); this
 * list decides what the API may send.
 *
 * PASTORAL answers (a prayer request, faith and the service experience) only
 * ever go to the person's own profile, never to a list, the Overview or an
 * export, because those are shown in leaders' meetings.
 */
export const ANSWER_FIELDS = [
  'firstName', 'lastName', 'phone', 'email', 'attendanceType', 'gender', 'howDidYouLearn', 'invitedBy', 'heardFromOther',
  'locatedInIbadan', 'membershipInterest', 'address', 'dateOfBirth', 'isStudent', 'occupation', 'bornAgain',
  'serviceExperience', 'prayerPoint', 'whatsappInterest', 'shareForConnections',
] as const satisfies readonly (keyof Visitor)[];

export const PASTORAL_FIELDS: ReadonlySet<string> = new Set(['bornAgain', 'serviceExperience', 'prayerPoint']);

export type Answers = Partial<Record<(typeof ANSWER_FIELDS)[number], unknown>>;

/** Every answer, pastoral ones included: the person's own profile only. */
export function allAnswers(v: Partial<Visitor>): Answers {
  return Object.fromEntries(ANSWER_FIELDS.map((k) => [k, v[k] ?? null]));
}

/**
 * The person's own profile, as the follow-up team reads it: every answer but
 * the prayer request, which only pastors and admins see.
 */
export function teamAnswers(v: Partial<Visitor>): Answers {
  return Object.fromEntries(ANSWER_FIELDS.filter((k) => k !== 'prayerPoint').map((k) => [k, v[k] ?? null]));
}

/** Answers safe for lists, the Overview and exports: pastoral ones left out entirely. */
export function publicAnswers(v: Partial<Visitor>): Answers {
  return Object.fromEntries(ANSWER_FIELDS.filter((k) => !PASTORAL_FIELDS.has(k)).map((k) => [k, v[k] ?? null]));
}
