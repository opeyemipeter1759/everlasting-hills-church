import { AuthLoginService } from './auth-login.service';

/** The login answer tells the website whether to send someone to the couple dashboard. */
function build(appMetadata: Record<string, unknown>, role: string | null) {
  const signInWithPassword = jest.fn().mockResolvedValue({
    data: {
      user: { id: 'user-1', email: 'ada@example.com', app_metadata: appMetadata, user_metadata: { needs_password_change: true } },
      session: { access_token: 'jwt', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer' },
    },
    error: null,
  });
  const prisma = {
    knownDevice: { findUnique: jest.fn().mockResolvedValue(null), count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}) },
  };
  const summary = { getProfileSummary: jest.fn().mockResolvedValue({ role, firstName: null, lastName: null, photoUrl: null, memberStatus: null }) };
  const online = { upgradeToMemberIfKnown: jest.fn().mockResolvedValue(undefined) };
  const config = { get: (k: string) => (k === 'DEFAULT_TENANT_ID' ? 'tenant-1' : 'https://everlastinghills.church') };
  return new AuthLoginService(
    prisma as never,
    { emit: jest.fn() } as never,
    { anonClient: { auth: { signInWithPassword } } } as never,
    summary as never,
    online as never,
    config as never,
  );
}

describe('signing in with a couple dashboard account', () => {
  it('marks the answer COUPLE and keeps the forced password change', async () => {
    const out = await build({ account: 'counselling_couple' }, null).login('ada@example.com', '08031234567');
    expect(out.user).toMatchObject({ account: 'COUPLE', role: null, needsPasswordChange: true });
  });

  it('treats the account as a church account once it has a role (the person became a member)', async () => {
    const out = await build({ account: 'counselling_couple' }, 'MEMBER').login('ada@example.com', 'secret');
    expect(out.user.account).toBe('CHURCH');
  });

  it('leaves ordinary accounts as church accounts', async () => {
    const out = await build({ role: 'MEMBER' }, 'MEMBER').login('ada@example.com', 'secret');
    expect(out.user.account).toBe('CHURCH');
  });
});
