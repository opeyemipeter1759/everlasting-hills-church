import { bodyIsPrivate, cleanSummary, sanitizeBody, skipRoute } from './audit-rules';

describe('which requests the audit trail keeps', () => {
  it.each([
    '/users/:profileId/grants',
    '/units/:unitId/members',
    '/members/:id',
    '/cms/pages/:key/publish',
    '/cms/site-config',
    '/visitors/:id',
    '/nav-permissions/grants',
    '/auth/change-password',
  ])('keeps %s', (route) => expect(skipRoute(route)).toBe(false));

  it.each([
    '/auth/login',
    '/auth/refresh',
    '/ai/help-chat',
    '/sermons/me/:sermonId/progress',
    '/classes/:slug/lessons/:lesson/watch-sessions/:sessionId/heartbeat',
    '/notifications/:id/read',
    '/push/subscribe',
    '/units/:unitId/messages/read',
    '/me/reading-plan/subscriptions/:id/days/:dayIndex/complete',
    '/follow-up/first-timers/:visitorId/photo/upload-url',
    '/uploads/image',
    '/follow-up/notes/:noteId/reactions',
    '/forms/register',
    '/cms/pages/:key/preview-token',
  ])('skips %s', (route) => expect(skipRoute(route)).toBe(true));

  it('keeps private messages and notes as actions, without what was written', () => {
    expect(bodyIsPrivate('/units/:unitId/messages')).toBe(true);
    expect(bodyIsPrivate('/follow-up/notes/:kind/:id')).toBe(true);
    expect(bodyIsPrivate('/users/:profileId/grants')).toBe(false);
  });

  // Granting the Pastor role opens medical certificates, so every role change
  // must be in the trail, with the role named (the body is kept).
  it.each([
    '/users/:profileId/grants',
    '/users/:profileId/grants/:role',
    '/users/:profileId/marriage-ministry',
    '/users/:profileId/head-usher',
  ])('keeps every role change in full: %s', (route) => {
    expect(skipRoute(route)).toBe(false);
    expect(bodyIsPrivate(route)).toBe(false);
  });

  it('keeps counselling document actions without their bodies, and skips the couple dashboard (it keeps its own events)', () => {
    expect(skipRoute('/premarital/documents/:requirementId/verify')).toBe(false);
    expect(bodyIsPrivate('/premarital/documents/view')).toBe(true);
    expect(bodyIsPrivate('/premarital/applications/:id/documents/delete-stored')).toBe(true);
    expect(skipRoute('/premarital/applications/:id/sign-in')).toBe(false);
    expect(bodyIsPrivate('/premarital/applications/:id/sign-in')).toBe(true);
    expect(skipRoute('/counselling/me/documents/:kind/upload')).toBe(true);
    expect(skipRoute('/counselling/me/documents/consent')).toBe(true);
  });
});

describe('what of a body the audit trail keeps', () => {
  it('hides secrets and prayer requests, keeps the rest', () => {
    expect(
      sanitizeBody({ email: 'a@b.com', password: 'x', newPassword: 'y', refreshToken: 'z', prayerPoint: 'heal me', role: 'ADMIN' }),
    ).toEqual({ email: 'a@b.com', password: '[hidden]', newPassword: '[hidden]', refreshToken: '[hidden]', prayerPoint: '[private]', role: 'ADMIN' });
  });

  it('cuts long text and long lists short', () => {
    const out = sanitizeBody({ note: 'a'.repeat(900), rows: Array.from({ length: 30 }, (_, i) => i) }) as { note: string; rows: unknown[] };
    expect(out.note).toHaveLength(501);
    expect(out.rows).toHaveLength(26);
    expect(out.rows[25]).toBe('…and 5 more');
  });

  it('keeps only the field names of a body too large to keep', () => {
    const block = () => Array.from({ length: 25 }, () => 'x'.repeat(480));
    const big = { blocks: block(), more: block(), title: 'Home' };
    expect(sanitizeBody(big)).toEqual({ note: 'Too large to keep in full', fields: ['blocks', 'more', 'title'] });
  });

  it('stores nothing for an empty body', () => {
    expect(sanitizeBody({})).toBeNull();
    expect(sanitizeBody(undefined)).toBeNull();
  });
});

describe('the summary line', () => {
  it.each([
    ['Create a department (ADMIN+)', 'Create a department'],
    ['Upload a media asset to R2 (alt text required) (PASTOR+)', 'Upload a media asset to R2'],
    ['Delete a first-timer for good; a copy of their details goes to the audit trail (ADMIN+)', 'Delete a first-timer for good'],
    ['Create an announcement — PUBLISHED fans out immediately', 'Create an announcement'],
    ['Like an article. Idempotent: a double tap counts once.', 'Like an article'],
  ])('%s → %s', (raw, clean) => expect(cleanSummary(raw, 'POST', '/x')).toBe(clean));

  it('falls back to the method and route', () => {
    expect(cleanSummary(undefined, 'PATCH', '/members/:id')).toBe('PATCH /members/:id');
  });
});
