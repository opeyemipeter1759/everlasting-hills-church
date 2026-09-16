import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../../auth/types/auth-user';
import type { PledgeDto } from '../dto/pledge.dto';
import { PledgeService } from './pledge.service';

/**
 * Pledges to church projects. One per member per project: pledging again
 * updates it. The rules that span fields live in the service.
 */
const actor = {
  email: 'tomike@example.com',
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
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => ({
          id: where.id,
          submittedAt: new Date(),
          ...data,
        }),
      ),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => ({
        id: where.id,
      })),
      findMany: jest.fn(async () => []),
    },
  };
  const emails = { adminEmail: 'church@example.com', dispatch: jest.fn() };
  const service = new PledgeService(
    prisma as never,
    emails as never,
    {
      get: jest.fn((key: string) =>
        key === 'DEFAULT_TENANT_ID'
          ? 'tenant-1'
          : 'https://everlastinghills.church',
      ),
    } as never,
  );
  return { service, prisma, emails };
}

beforeEach(() =>
  jest.useFakeTimers().setSystemTime(new Date('2026-09-15T10:00:00Z')),
);
afterEach(() => jest.useRealTimers());

describe('making a pledge', () => {
  it("records a member's pledge against the project and confirms it by email", async () => {
    const { service, prisma, emails } = makeService();

    const saved = await service.submit(actor, 'sound-media', pledge());

    const { data } = (prisma.formSubmission.create as jest.Mock).mock
      .calls[0][0];
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

    const recipients = (emails.dispatch as jest.Mock).mock.calls.map(
      ([mail]) => mail.to,
    );
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
    const { where, data } = (prisma.formSubmission.update as jest.Mock).mock
      .calls[0][0];
    expect(where).toEqual({ id: 'pledge-1' });
    expect(data.data.amount).toBe(300_000);
    expect(data.data.createdAt).toBe('2026-09-01T09:00:00.000Z');
  });

  it("looks for the pledge in this church, this project and this member's profile", async () => {
    const { service, prisma } = makeService();
    await service.mine(actor, 'sound-media');

    expect(prisma.formSubmission.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant-1',
        type: 'pledge:sound-media',
        data: { path: ['profileId'], equals: 'profile-1' },
      },
    });
  });

  it('claims a logged-out pledge when its email matches the signed-in member', async () => {
    const anonymous = {
      id: 'public-pledge-1',
      submittedAt: new Date('2026-09-01T09:00:00Z'),
      data: {
        profileId: null,
        memberId: null,
        fullName: 'Tomike Kolajo',
        phone: '0810 235 5043',
        email: 'tomike@example.com',
        amount: 250_000,
        method: 'MONTHLY',
        methodOther: null,
        installmentAmount: 25_000,
        completeBy: '2026-12-31',
        contactMe: true,
        trackingTokenHash: 'private-hash',
        installments: [],
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z',
      },
    };
    const { service, prisma } = makeService();
    (prisma.formSubmission.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(anonymous);

    const saved = await service.mine(actor, 'sound-media');

    expect(prisma.formSubmission.update).toHaveBeenCalledWith({
      where: { id: 'public-pledge-1' },
      data: {
        data: expect.objectContaining({
          profileId: 'profile-1',
          memberId: 'member-1',
          trackingTokenHash: 'private-hash',
          installments: [],
        }),
      },
    });
    expect(saved).toMatchObject({
      id: 'public-pledge-1',
      memberId: 'member-1',
    });
    expect(saved).not.toHaveProperty('profileId');
  });

  it('merges an existing public duplicate into the member pledge without losing giving history', async () => {
    const memberRow = {
      id: 'member-pledge',
      submittedAt: new Date('2026-08-01T09:00:00Z'),
      data: {
        profileId: 'profile-1',
        memberId: 'member-1',
        fullName: 'Tomike Kolajo',
        phone: '0810 235 5043',
        email: 'tomike@example.com',
        amount: 200_000,
        method: 'MONTHLY',
        methodOther: null,
        installmentAmount: 50_000,
        completeBy: '2026-12-31',
        contactMe: true,
        trackingTokenHash: null,
        installments: [
          {
            id: 'member-installment',
            amount: 50_000,
            givenOn: '2026-08-15',
            note: null,
            createdAt: '2026-08-15T09:00:00.000Z',
          },
        ],
        createdAt: '2026-08-01T09:00:00.000Z',
        updatedAt: '2026-08-15T09:00:00.000Z',
      },
    };
    const publicRow = {
      id: 'public-pledge',
      submittedAt: new Date('2026-09-01T09:00:00Z'),
      data: {
        ...memberRow.data,
        profileId: null,
        memberId: null,
        amount: 250_000,
        trackingTokenHash: 'private-hash',
        installments: [
          {
            id: 'public-installment',
            amount: 25_000,
            givenOn: '2026-09-02',
            note: 'Transfer',
            createdAt: '2026-09-02T09:00:00.000Z',
          },
        ],
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-02T09:00:00.000Z',
      },
    };
    const { service, prisma } = makeService();
    (prisma.formSubmission.findFirst as jest.Mock)
      .mockResolvedValueOnce(memberRow)
      .mockResolvedValueOnce(publicRow);

    const saved = await service.mine(actor, 'sound-media');

    const merged = (prisma.formSubmission.update as jest.Mock).mock.calls[0][0]
      .data.data;
    expect(merged).toMatchObject({
      profileId: 'profile-1',
      memberId: 'member-1',
      amount: 250_000,
      trackingTokenHash: 'private-hash',
    });
    expect(merged.installments).toHaveLength(2);
    expect(saved).toMatchObject({
      amountGiven: 75_000,
      balance: 175_000,
      progressPercent: 30,
    });
    expect(prisma.formSubmission.delete).toHaveBeenCalledWith({
      where: { id: 'public-pledge' },
    });
  });

  it('drops an installment amount that does not apply to a one-time payment', async () => {
    const { service, prisma } = makeService();
    await service.submit(
      actor,
      'sound-media',
      pledge({ method: 'ONE_TIME', installmentAmount: 5_000 }),
    );

    expect(
      (prisma.formSubmission.create as jest.Mock).mock.calls[0][0].data.data
        .installmentAmount,
    ).toBeNull();
  });

  it('accepts a pledge from a public visitor without a profile or member account', async () => {
    const { service, prisma, emails } = makeService();

    const saved = await service.submitPublic(
      undefined,
      'sound-media',
      pledge(),
    );

    const { data } = (prisma.formSubmission.create as jest.Mock).mock
      .calls[0][0];
    expect(data.data).toMatchObject({
      profileId: null,
      memberId: null,
      fullName: 'Tomike Kolajo',
      amount: 250_000,
    });
    expect(saved).not.toHaveProperty('profileId');
    expect(saved).not.toHaveProperty('trackingTokenHash');
    expect(saved).toHaveProperty(
      'trackingToken',
      expect.stringMatching(/^[A-Za-z0-9_-]{32}$/),
    );
    expect(data.data.trackingTokenHash).not.toBe(saved.trackingToken);
    expect(emails.dispatch).toHaveBeenCalledTimes(2);
    expect(emails.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'tomike@example.com',
        text: expect.stringContaining(`/pledge/track/${saved.trackingToken}`),
      }),
    );
  });

  it('stops a logged-out repeat from creating a duplicate pledge', async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date('2026-09-01T09:00:00Z'),
      data: {
        profileId: 'profile-1',
        email: 'tomike@example.com',
      },
    });

    await expect(
      service.submitPublic(undefined, 'sound-media', pledge()),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.submitPublic(undefined, 'sound-media', pledge()),
    ).rejects.toThrow(/already exists.*Sign in/i);
    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
    expect(prisma.formSubmission.update).not.toHaveBeenCalled();
  });

  it("uses a signed-in visitor's existing member pledge from the public form", async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date('2026-09-01T09:00:00Z'),
      data: { profileId: 'profile-1', createdAt: '2026-09-01T09:00:00.000Z' },
    });

    await service.submitPublic(
      actor,
      'sound-media',
      pledge({ amount: 400_000 }),
    );

    expect(prisma.formSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pledge-1' },
        data: {
          data: expect.objectContaining({
            profileId: 'profile-1',
            amount: 400_000,
          }),
        },
      }),
    );
    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
  });
});

describe('tracking installment giving', () => {
  const storedPledge = {
    profileId: 'profile-1',
    memberId: 'member-1',
    fullName: 'Tomike Kolajo',
    phone: '0810 235 5043',
    email: 'tomike@example.com',
    amount: 250_000,
    method: 'MONTHLY',
    methodOther: null,
    installmentAmount: 50_000,
    completeBy: '2026-12-31',
    contactMe: true,
    trackingTokenHash: null,
    installments: [
      {
        id: 'installment-1',
        amount: 50_000,
        givenOn: '2026-09-01',
        note: 'Transfer',
        createdAt: '2026-09-01T09:00:00.000Z',
      },
    ],
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  };

  it('adds a dated installment and returns paid, balance and percentage progress', async () => {
    const { service, prisma, emails } = makeService({
      id: 'pledge-1',
      submittedAt: new Date('2026-09-01T08:00:00Z'),
      data: storedPledge,
    });

    const result = await service.addMineInstallment(actor, 'sound-media', {
      amount: 50_000,
      givenOn: '2026-09-15',
      note: 'Second transfer',
    });

    const updated = (prisma.formSubmission.update as jest.Mock).mock.calls[0][0]
      .data.data;
    expect(updated.installments).toHaveLength(2);
    expect(updated.installments[1]).toMatchObject({
      amount: 50_000,
      givenOn: '2026-09-15',
      note: 'Second transfer',
    });
    expect(result).toMatchObject({
      amountGiven: 100_000,
      balance: 150_000,
      progressPercent: 40,
    });
    expect(emails.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'tomike@example.com',
        tag: 'pledge-installment',
      }),
    );
  });

  it('finds a public pledge by a hashed private token without returning the hash', async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date(),
      data: {
        ...storedPledge,
        profileId: null,
        trackingTokenHash: 'stored-secret-hash',
      },
    });

    const result = await service.tracked(
      'sound-media',
      'abcdefghijklmnopqrstuvwxyz123456',
    );

    expect(prisma.formSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        type: 'pledge:sound-media',
        data: {
          path: ['trackingTokenHash'],
          equals: expect.stringMatching(/^[a-f0-9]{64}$/),
        },
      },
    });
    expect(result).not.toHaveProperty('trackingTokenHash');
    expect(result).not.toHaveProperty('profileId');
  });

  it('refuses an installment larger than the remaining pledge balance', async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date(),
      data: storedPledge,
    });

    await expect(
      service.addMineInstallment(actor, 'sound-media', {
        amount: 210_000,
        givenOn: '2026-09-15',
      }),
    ).rejects.toThrow(/Only .* remains/);
    expect(prisma.formSubmission.update).not.toHaveBeenCalled();
  });

  it('refuses a future installment date', async () => {
    const { service } = makeService({
      id: 'pledge-1',
      submittedAt: new Date(),
      data: storedPledge,
    });

    await expect(
      service.addMineInstallment(actor, 'sound-media', {
        amount: 50_000,
        givenOn: '2026-09-16',
      }),
    ).rejects.toThrow(/cannot be in the future/);
  });

  it('does not let an updated pledge fall below giving already recorded', async () => {
    const { service, prisma } = makeService({
      id: 'pledge-1',
      submittedAt: new Date(),
      data: storedPledge,
    });

    await expect(
      service.submit(actor, 'sound-media', pledge({ amount: 40_000 })),
    ).rejects.toThrow(/cannot be lower than/);
    expect(prisma.formSubmission.update).not.toHaveBeenCalled();
  });
});

describe('what a pledge must say', () => {
  it.each([
    [
      'weekly without an installment amount',
      pledge({ method: 'WEEKLY', installmentAmount: undefined }),
      /per installment/,
    ],
    [
      'an installment bigger than the pledge',
      pledge({ installmentAmount: 300_000 }),
      /more than the whole pledge/,
    ],
    [
      '"other" without saying how',
      pledge({ method: 'OTHER', methodOther: '  ' }),
      /how you intend/,
    ],
    [
      'a completion date already past',
      pledge({ completeBy: '2026-09-14' }),
      /from today onwards/,
    ],
  ])('refuses %s', async (_label, input, message) => {
    const { service, prisma } = makeService();
    await expect(service.submit(actor, 'sound-media', input)).rejects.toThrow(
      message,
    );
    await expect(
      service.submit(actor, 'sound-media', input),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
  });

  it('accepts today as the completion date', async () => {
    const { service } = makeService();
    await expect(
      service.submit(
        actor,
        'sound-media',
        pledge({ completeBy: '2026-09-15' }),
      ),
    ).resolves.toBeDefined();
  });

  it('knows only the appeals the church has launched', async () => {
    const { service } = makeService();
    await expect(
      service.submit(actor, 'new-roof', pledge()),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.list('__proto__')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('the list leaders see', () => {
  it('totals the pledges and counts who asked to be contacted', async () => {
    const { service, prisma } = makeService();
    (prisma.formSubmission.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'a',
        submittedAt: new Date(),
        data: {
          profileId: 'p1',
          fullName: 'A',
          amount: 100_000,
          contactMe: true,
        },
      },
      {
        id: 'b',
        submittedAt: new Date(),
        data: {
          profileId: 'p2',
          fullName: 'B',
          amount: 50_000,
          contactMe: false,
        },
      },
    ]);

    const result = await service.list('sound-media');

    expect(result.campaign).toEqual({
      key: 'sound-media',
      title: 'Sound & Media Project',
    });
    expect(result.totals).toEqual({
      pledges: 2,
      amount: 150_000,
      amountGiven: 0,
      balance: 150_000,
      wantContact: 1,
    });
    expect(result.pledges[0]).not.toHaveProperty('profileId');
    expect(prisma.formSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', type: 'pledge:sound-media' },
      }),
    );
  });
});
