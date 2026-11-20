import { CounsellingStatus } from '@prisma/client';
import { lagosLabel, lagosParts, lagosToUtc } from './lagos-time';
import {
  adminPatchSchema,
  modulePatchSchema,
  publicApplicationSchema,
  sessionPatchSchema,
  STATUSES,
} from './premarital.schema';
import { ALLOWED, canTransition } from './status-machine';
import { validApplication } from './premarital.fixture-spec';

const first = (raw: unknown) => {
  const r = publicApplicationSchema.safeParse(raw);
  if (r.success) return {};
  const out: Record<string, string> = {};
  for (const i of r.error.issues) out[i.path.join('.')] ??= i.message;
  return out;
};

describe('the counselling status machine', () => {
  const expected: [CounsellingStatus, CounsellingStatus][] = [
    ['SUBMITTED', 'UNDER_REVIEW'],
    ['UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'],
    ['ADDITIONAL_INFORMATION_REQUIRED', 'UNDER_REVIEW'],
    ['UNDER_REVIEW', 'ACCEPTED_FOR_COUNSELLING'],
    ['ACCEPTED_FOR_COUNSELLING', 'IN_COUNSELLING'],
    ['IN_COUNSELLING', 'FINAL_REVIEW'],
    ['FINAL_REVIEW', 'COMPLETED'],
    ['FINAL_REVIEW', 'IN_COUNSELLING'],
    ...(
      [
        'SUBMITTED',
        'UNDER_REVIEW',
        'ADDITIONAL_INFORMATION_REQUIRED',
        'ACCEPTED_FOR_COUNSELLING',
        'IN_COUNSELLING',
        'FINAL_REVIEW',
      ] as const
    ).map((s) => [s, 'CLOSED'] as [CounsellingStatus, CounsellingStatus]),
  ];
  const allowed = new Set(expected.map(([a, b]) => `${a}>${b}`));

  it.each(expected)('allows %s to %s', (from, to) =>
    expect(canTransition(from, to)).toBe(true),
  );

  it('refuses every other move, including anything out of Completed or Closed', () => {
    let refused = 0;
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        if (allowed.has(`${from}>${to}`)) continue;
        expect(canTransition(from, to)).toBe(false);
        refused++;
      }
    }
    expect(refused).toBe(STATUSES.length * STATUSES.length - expected.length);
    expect(ALLOWED.COMPLETED).toEqual([]);
    expect(ALLOWED.CLOSED).toEqual([]);
  });
});

describe('the public application rules', () => {
  it('accepts a complete application and tidies it', () => {
    const r = publicApplicationSchema.parse(validApplication());
    expect(r.applicantEmail).toBe('tunde@example.com');
    expect(r.partnerEmail).toBeNull();
  });

  it('names each problem under its own answer', () => {
    expect(
      first({ submissionKey: validApplication().submissionKey }),
    ).toMatchObject({
      applicantFirstName: 'Enter your first name',
      applicantEmail: 'Enter your email address',
      partnerFirstName: "Enter your partner's first name",
      partnerConsentToContact:
        'Confirm your partner is happy for us to contact them',
      membership: 'Tell us whether you are members of Everlasting Hills',
      preferredContact: 'Choose how we should contact you',
      privacyAcknowledged: 'Please read and accept the privacy notice',
    });
  });

  it('needs a way to reach the partner, and refuses a past date and an over-long note', () => {
    expect(first({ ...validApplication(), partnerPhone: '' })).toEqual({
      partnerPhone: 'Give a phone number or email address for your partner',
    });
    expect(first({ ...validApplication(), weddingDate: '2020-01-01' })).toEqual(
      { weddingDate: 'The wedding date cannot be in the past' },
    );
    expect(first({ ...validApplication(), intro: 'x'.repeat(501) })).toEqual({
      intro: 'Keep this under 500 characters',
    });
  });
});

describe('PATCH shapes leave out what is not sent (the Gatherings .partial() bug)', () => {
  it.each([
    ['admin', adminPatchSchema, { adminNote: 'Call after 5pm' }, ['adminNote']],
    [
      'session',
      sessionPatchSchema,
      { durationMinutes: 90 },
      ['durationMinutes'],
    ],
    ['module', modulePatchSchema, { active: false }, ['active']],
  ] as const)('%s', (_name, schema, input, keys) => {
    expect(Object.keys(schema.parse(input))).toEqual(keys);
  });
});

describe('Lagos time (the Gatherings toView bug)', () => {
  it('a session at 00:30 on 1 December in Lagos is 23:30 UTC on 30 November, and shows as 1 December', () => {
    const at = lagosToUtc('2026-12-01', '00:30');
    expect(at.toISOString()).toBe('2026-11-30T23:30:00.000Z');
    expect(lagosParts(at)).toEqual({ date: '2026-12-01', time: '00:30' });
    expect(lagosLabel(at)).toMatch(/Tuesday, 1 December 2026 at 12:30\s?am/i);
  });

  it('the last minute of a Lagos day stays on that day', () => {
    expect(lagosParts(new Date('2026-11-30T22:59:00Z'))).toEqual({
      date: '2026-11-30',
      time: '23:59',
    });
  });
});
