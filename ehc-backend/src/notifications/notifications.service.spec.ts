import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

/**
 * NotificationsService tests.
 *
 * We mock Resend so no actual emails are sent. We verify:
 *   - Email send path is correct
 *   - Resend failures are caught (fire-and-forget never throws back to caller)
 *   - When RESEND_API_KEY is missing, the service logs but doesn't crash
 */

const sendMock = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

function makeService(apiKey: string | undefined, from?: string) {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return apiKey;
      if (key === 'RESEND_FROM') return from;
      return undefined;
    }),
  } as unknown as ConfigService;
  return new NotificationsService(config as never);
}

beforeEach(() => {
  sendMock.mockReset();
});

describe('NotificationsService.handleSendEmail', () => {
  it('sends via Resend with the configured From address', async () => {
    sendMock.mockResolvedValue({ id: 'msg-1' });
    const service = makeService('re_test_key', 'noreply@ehc.example');

    await service.handleSendEmail({
      to: 'user@example.com',
      subject: 'Hi',
      text: 'Hello',
      tag: 'test',
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: 'Everlasting Hills <noreply@ehc.example>',
      to: 'user@example.com',
      subject: 'Hi',
      text: 'Hello',
    });
  });

  it('falls back to onboarding@resend.dev when RESEND_FROM is unset', async () => {
    sendMock.mockResolvedValue({ id: 'msg-2' });
    const service = makeService('re_test_key', undefined);

    await service.handleSendEmail({ to: 'a@b.com', subject: 's', text: 't', tag: 'x' });

    expect(sendMock.mock.calls[0][0].from).toBe('Everlasting Hills <onboarding@resend.dev>');
  });

  it('does NOT throw when Resend fails (fire-and-forget contract)', async () => {
    sendMock.mockRejectedValue(new Error('Network timeout'));
    const service = makeService('re_test_key', 'a@b.com');

    await expect(
      service.handleSendEmail({ to: 'x@y.com', subject: 's', text: 't', tag: 'tag' }),
    ).resolves.toBeUndefined();
  });

  it('silently drops email (no crash) when RESEND_API_KEY is not configured', async () => {
    const service = makeService(undefined, 'a@b.com');

    await expect(
      service.handleSendEmail({ to: 'x@y.com', subject: 's', text: 't', tag: 'tag' }),
    ).resolves.toBeUndefined();

    expect(sendMock).not.toHaveBeenCalled();
  });
});
