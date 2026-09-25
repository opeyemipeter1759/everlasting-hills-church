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

function makeService(
  apiKey: string | undefined,
  from?: string,
  activeMember: { id: string } | null = { id: 'member-1' },
) {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return apiKey;
      if (key === 'RESEND_FROM') return from;
      if (key === 'DEFAULT_TENANT_ID') return 'tenant-1';
      return undefined;
    }),
  } as unknown as ConfigService;
  const prisma = {
    member: { findFirst: jest.fn().mockResolvedValue(activeMember) },
  };
  return { service: new NotificationsService(config as never, prisma as never), prisma };
}

beforeEach(() => {
  sendMock.mockReset();
});

describe('NotificationsService.handleSendEmail', () => {
  it('sends via Resend with the configured From address', async () => {
    sendMock.mockResolvedValue({ id: 'msg-1' });
    const { service } = makeService('re_test_key', 'noreply@ehc.example');

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
    const { service } = makeService('re_test_key', undefined);

    await service.handleSendEmail({ to: 'a@b.com', subject: 's', text: 't', tag: 'x' });

    expect(sendMock.mock.calls[0][0].from).toBe('Everlasting Hills <onboarding@resend.dev>');
  });

  it('does NOT throw when Resend fails (fire-and-forget contract)', async () => {
    sendMock.mockRejectedValue(new Error('Network timeout'));
    const { service } = makeService('re_test_key', 'a@b.com');

    await expect(
      service.handleSendEmail({ to: 'x@y.com', subject: 's', text: 't', tag: 'tag' }),
    ).resolves.toBeUndefined();
  });

  it('silently drops email (no crash) when RESEND_API_KEY is not configured', async () => {
    const { service } = makeService(undefined, 'a@b.com');

    await expect(
      service.handleSendEmail({ to: 'x@y.com', subject: 's', text: 't', tag: 'tag' }),
    ).resolves.toBeUndefined();

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('suppresses member-only email when the member is non-active', async () => {
    const { service, prisma } = makeService('re_test_key', 'a@b.com', null);

    await service.handleSendEmail({
      to: 'former@example.com',
      subject: 'Member update',
      text: 'Hello',
      tag: 'member-update',
      memberOnly: true,
    });

    expect(prisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        status: 'ACTIVE',
        email: { equals: 'former@example.com', mode: 'insensitive' },
      },
      select: { id: true },
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('delivers member-only email when the member is active', async () => {
    sendMock.mockResolvedValue({ data: { id: 'msg-active' }, error: null });
    const { service } = makeService('re_test_key', 'a@b.com');

    await service.handleSendEmail({
      to: 'active@example.com',
      subject: 'Member update',
      text: 'Hello',
      tag: 'member-update',
      memberOnly: true,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
