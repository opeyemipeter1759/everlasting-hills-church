import { UnauthorizedException } from '@nestjs/common';
import { AuthSessionService } from './auth-session.service';
import { createRecoveryLink } from '../recovery-link';

jest.mock('../recovery-link', () => ({ createRecoveryLink: jest.fn() }));

function build(verifyOtp = jest.fn()) {
  const events = { emitAsync: jest.fn().mockResolvedValue([]) };
  const supabase = { anonClient: { auth: { verifyOtp } } };
  const config = { get: () => 'https://everlastinghills.church' };
  const svc = new AuthSessionService(supabase as never, {} as never, events as never, config as never);
  return { svc, events, verifyOtp };
}

describe('Forgot password', () => {
  beforeEach(() => jest.mocked(createRecoveryLink).mockReset());

  it('emails a link to the live site, not wherever Supabase is configured to send people', async () => {
    jest.mocked(createRecoveryLink).mockResolvedValue({
      link: 'https://everlastinghills.church/change-password?token_hash=abc&type=recovery',
    });
    const { svc, events } = build();

    await svc.requestPasswordReset('ada@example.com');

    expect(createRecoveryLink).toHaveBeenCalledWith('ada@example.com', 'https://everlastinghills.church');
    const [, email] = events.emitAsync.mock.calls[0];
    expect(email).toMatchObject({ to: 'ada@example.com', tag: 'password-reset', subject: 'Reset your Everlasting Hills password' });
    expect(email.text).toContain('https://everlastinghills.church/change-password?token_hash=abc&type=recovery');
    expect(email.html).toContain('https://everlastinghills.church/change-password?token_hash=abc');
    expect(email.html).not.toContain('localhost');
  });

  it('gives the same answer for an unknown address and sends nothing', async () => {
    jest.mocked(createRecoveryLink).mockResolvedValue({ link: null, reason: 'User not found' });
    const { svc, events } = build();

    await expect(svc.requestPasswordReset('nobody@example.com')).resolves.toMatchObject({ success: true });
    expect(events.emitAsync).not.toHaveBeenCalled();
  });
});

describe('Opening the reset link', () => {
  it("swaps the link's one-time token for a short session", async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: { session: { access_token: 'jwt', expires_in: 3600 } }, error: null });
    const { svc } = build(verifyOtp);

    await expect(svc.verifyRecovery('abc')).resolves.toEqual({ access_token: 'jwt', expires_in: 3600 });
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'abc' });
  });

  it('refuses a used or expired link with a message saying to request a new one', async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: { session: null }, error: { message: 'Token has expired' } });
    const { svc } = build(verifyOtp);

    await expect(svc.verifyRecovery('old')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
