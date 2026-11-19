import { applicationSchema, lagosToday } from './pre-marital.schema';
import { validApplication } from './pre-marital.fixture-spec';

const issues = (raw: unknown) => {
  const r = applicationSchema.safeParse(raw);
  // The first problem with each field, as the form shows it.
  return r.success
    ? {}
    : Object.fromEntries(
        [...r.error.issues].reverse().map((i) => [i.path.join('.'), i.message]),
      );
};

describe('the pre-marital counselling application rules', () => {
  it('accepts a complete application and tidies it', () => {
    const r = applicationSchema.parse(validApplication());
    expect(r.groomEmail).toBe('tunde@example.com');
    expect(r.consent).toBe(true);
  });

  it('accepts one with only the required answers', () => {
    const {
      weddingDate: _w,
      relationshipLength: _r,
      message: _m,
      ...required
    } = validApplication();
    expect(applicationSchema.safeParse(required).success).toBe(true);
  });

  it('names every missing required answer, field by field', () => {
    expect(
      issues({ submissionKey: validApplication().submissionKey }),
    ).toMatchObject({
      groomFirstName: expect.any(String),
      groomLastName: expect.any(String),
      groomPhone: expect.any(String),
      groomEmail: expect.any(String),
      groomIsMember: expect.stringContaining('member'),
      brideFirstName: expect.any(String),
      brideLastName: expect.any(String),
      bridePhone: expect.any(String),
      brideEmail: expect.any(String),
      brideIsMember: expect.stringContaining('member'),
      consent: 'Both of you need to agree to apply',
    });
  });

  it('refuses bad contact details, a past wedding date and an unknown option', () => {
    const bad = issues({
      ...validApplication(),
      groomPhone: 'call me',
      bridePhone: '123',
      brideEmail: 'not-an-email',
      weddingDate: '2020-01-01',
      relationshipLength: 'FOREVER',
    });
    expect(bad).toEqual({
      groomPhone: 'Use digits, spaces, + or brackets only',
      bridePhone: 'That phone number is too short',
      brideEmail: 'Enter a valid email address',
      weddingDate: 'The wedding date cannot be in the past',
      relationshipLength: 'Pick one of the options',
    });
  });

  it('allows a wedding date of today, in Lagos', () => {
    expect(
      applicationSchema.safeParse({
        ...validApplication(),
        weddingDate: lagosToday(),
      }).success,
    ).toBe(true);
  });

  it('needs the key the form makes, so retries can be recognised', () => {
    expect(issues({ ...validApplication(), submissionKey: 'abc' })).toEqual({
      submissionKey: 'Reload the page and try again',
    });
  });

  it('caps the note', () => {
    expect(
      issues({ ...validApplication(), message: 'x'.repeat(1001) }),
    ).toEqual({ message: 'Keep this under 1,000 characters' });
  });
});
