import { PledgeService } from './pledge.service';

/**
 * Getting a private tracking link back.
 *
 * Someone who pledges without an account holds nothing but that link. The
 * reply must be the same whether or not the address has pledged, or anyone
 * could use this to find out who gives to the church.
 */
function makeService(existing: Record<string, unknown> | null) {
  const prisma = {
    formSubmission: {
      findFirst: jest.fn(async () => existing),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
        id: where.id,
        submittedAt: new Date(),
        ...data,
      })),
    },
  };
  const emails = { adminEmail: 'church@example.com', dispatch: jest.fn() };
  const service = new PledgeService(prisma as never, emails as never, {
    get: jest.fn((key: string) =>
      key === 'DEFAULT_TENANT_ID' ? 'tenant-1' : 'https://everlastinghills.church',
    ),
  } as never);
  return { service, prisma, emails };
}

const anonymousPledge = {
  id: 'pledge-1',
  submittedAt: new Date('2026-09-15T10:00:00Z'),
  data: {
    profileId: null,
    fullName: 'Ada Visitor',
    email: 'ada@example.com',
    amount: 100_000,
    method: 'ONE_TIME',
    trackingTokenHash: 'old-hash',
    installments: [],
  },
};

describe('asking for a tracking link again', () => {
  it('emails a fresh private link and retires the old one', async () => {
    const { service, prisma, emails } = makeService(anonymousPledge);

    await expect(service.resendTrackingLink('sound-media', 'Ada@Example.com')).resolves.toEqual({
      sent: true,
    });

    const [mail] = emails.dispatch.mock.calls[0];
    const link = /\/pledge\/track\/([A-Za-z0-9_-]{32})/.exec(mail.text);
    expect(mail.to).toBe('ada@example.com');
    expect(link).not.toBeNull();
    expect(mail.text).toContain('no longer works');
    // Where to send the money travels with the link.
    expect(mail.text).toContain('2007060223');
    expect(mail.text).toContain('EVERLASTING HEIGHTS MINISTRIES');

    const saved = (prisma.formSubmission.update as jest.Mock).mock.calls[0][0].data
      .data as Record<string, string>;
    expect(saved.trackingTokenHash).not.toBe('old-hash');
    expect(saved.trackingTokenHash).toHaveLength(64);
    // The token itself is never stored.
    expect(saved.trackingTokenHash).not.toContain(link![1]);
  });

  it('points a member at their dashboard instead of a link', async () => {
    const { service, prisma, emails } = makeService({
      ...anonymousPledge,
      data: { ...anonymousPledge.data, profileId: 'profile-1' },
    });

    await service.resendTrackingLink('sound-media', 'ada@example.com');

    expect(prisma.formSubmission.update).not.toHaveBeenCalled();
    const [mail] = emails.dispatch.mock.calls[0];
    expect(mail.text).toContain('/dashboard');
    expect(mail.text).not.toMatch(/\/pledge\/track\//);
  });

  it('answers the same for an address that never pledged, and emails nobody', async () => {
    const { service, emails } = makeService(null);

    await expect(service.resendTrackingLink('sound-media', 'stranger@example.com')).resolves.toEqual({
      sent: true,
    });
    expect(emails.dispatch).not.toHaveBeenCalled();
  });
});
