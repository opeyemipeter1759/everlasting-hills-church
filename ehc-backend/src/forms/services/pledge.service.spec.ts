import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import type { PledgeDto } from '../dto/pledge.dto';
import { PledgeService } from './pledge.service';

/**
 * Pledges to church projects. One per member per project: pledging again
 * updates it. The rules that span fields live in the service.
 */
const actor = {
  profileId: 'profile-1',
  memberId: 'member-1',
  tenantId: 'tenant-1',
  effectiveRoles: [Role.MEMBER],
} as unknown as AuthUser;

const pledge = (overrides: Partial<PledgeDto> = {}): PledgeDto => ({
  fullName: '  Tomike Kolajo ',
  phone: '0810 235 5043',
  email: 'Tomike@Example.com',
  amount: 250_000,
  method: 'MONTHLY',
  installmentAmount: 25_000,
  completeBy: '2026-12-31',
  contactMe: true,
  confirmed: true,
  ...overrides,
});

function makeService(existing: Record<string, unknown> | null = null) {
  const prisma = {
    formSubmission: {
      findFirst: jest.fn(async () => existing),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'new-id',
        submittedAt: new Date(),
        ...data,
      })),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
        id: where.id,
        submittedAt: new Date(),
        ...data,
      })),
      findMany: jest.fn(async () => []),
    },
  };
  const emails = { adminEmail: 'church@example.com', dispatch: jest.fn() };
  const service = new PledgeService(
    prisma as never,
    emails as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, prisma, emails };
}

beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-09-15T10:00:00Z')));
afterEach(() => jest.useRealTimers());

describe('making a pledge', () => {
  it("records a member's pledge against the project and confirms it by email", async () => {
    const { service, prisma, emails } = makeService();

    const saved = await service.submit(actor, 'sound-media', pledge());

    const { data } = (prisma.formSubmission.create as jest.Mock).mock.calls[0][0];
    expect(data.tenantId).toBe('tenant-1');
    expect(data.type).toBe('pledge:sound-media');
    expect(data.data).toMatchObject({
      profileId: 'profile-1',
      memberId: 'member-1',
      fullName: 'Tomike Kolajo',
      email: 'tomike@example.com',
      amount: 250_000,
      method: 'MONTHLY',
      installmentAmount: 25_000,
      completeBy: '2026-12-31',
      contactMe: true,
    });
    // The profile id is how the pledge is found, never something to hand back.
    expect(saved).not.toHaveProperty('profileId');

    const recipients = (emails.dispatch as jest.Mock).mock.calls.map(([mail]) => mail.to);
    expect(recipients).toEqual(['church@example.com', 'tomike@example.com']);
  });

  it("updates the member's existing pledge rather than adding a second", async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date('2026-09-01T09:00:00Z'),
      data: { profileId: 'profile-1', createdAt: '2026-09-01T09:00:00.000Z' },
    });

    await service.submit(actor, 'sound-media', pledge({ amount: 300_000 }));

    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
    const { where, data } = (prisma.formSubmission.update as jest.Mock).mock.calls[0][0];
    expect(where).toEqual({ id: 'pledge-1' });
    expect(data.data.amount).toBe(300_000);
    expect(data.data.createdAt).toBe('2026-09-01T09:00:00.000Z');
  });

  it("looks for the pledge only in this church, this project and this member's name", async () => {
    const { service, prisma } = makeService();
    await service.mine(actor, 'sound-media');

    expect(prisma.formSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        type: 'pledge:sound-media',
        data: { path: ['profileId'], equals: 'profile-1' },
      },
    });
  });

  it('drops an installment amount that does not apply to a one-time payment', async () => {
    const { service, prisma } = makeService();
    await service.submit(actor, 'sound-media', pledge({ method: 'ONE_TIME', installmentAmount: 5_000 }));

    expect((prisma.formSubmission.create as jest.Mock).mock.calls[0][0].data.data.installmentAmount).toBeNull();
  });
});

describe('what a pledge must say', () => {
  it.each([
    ['weekly without an installment amount', pledge({ method: 'WEEKLY', installmentAmount: undefined }), /per installment/],
    ['an installment bigger than the pledge', pledge({ installmentAmount: 300_000 }), /more than the whole pledge/],
    ['"other" without saying how', pledge({ method: 'OTHER', methodOther: '  ' }), /how you intend/],
    ['a completion date already past', pledge({ completeBy: '2026-09-14' }), /from today onwards/],
  ])('refuses %s', async (_label, input, message) => {
    const { service, prisma } = makeService();
    await expect(service.submit(actor, 'sound-media', input)).rejects.toThrow(message);
    await expect(service.submit(actor, 'sound-media', input)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
  });

  it('accepts today as the completion date', async () => {
    const { service } = makeService();
    await expect(
      service.submit(actor, 'sound-media', pledge({ completeBy: '2026-09-15' })),
    ).resolves.toBeDefined();
  });

  it('knows only the appeals the church has launched', async () => {
    const { service } = makeService();
    await expect(service.submit(actor, 'new-roof', pledge())).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.list('__proto__')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('the list leaders see', () => {
  it('totals the pledges and counts who asked to be contacted', async () => {
    const { service, prisma } = makeService();
    (prisma.formSubmission.findMany as jest.Mock).mockResolvedValue([
      { id: 'a', submittedAt: new Date(), data: { profileId: 'p1', fullName: 'A', amount: 100_000, contactMe: true } },
      { id: 'b', submittedAt: new Date(), data: { profileId: 'p2', fullName: 'B', amount: 50_000, contactMe: false } },
    ]);

    const result = await service.list('sound-media');

    expect(result.campaign).toEqual({ key: 'sound-media', title: 'Sound & Media Project' });
    expect(result.totals).toEqual({ pledges: 2, amount: 150_000, wantContact: 1 });
    expect(result.pledges[0]).not.toHaveProperty('profileId');
    expect(prisma.formSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', type: 'pledge:sound-media' } }),
    );
  });
});
