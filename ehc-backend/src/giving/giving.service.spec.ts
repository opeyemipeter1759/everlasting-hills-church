import { BadGatewayException } from '@nestjs/common';
import { GivingService } from './giving.service';

const record = {
  id: 'giving-1',
  tenantId: 'tenant-1',
  reference: 'ehc-ref',
  amount: 500_000,
  currency: 'NGN',
  donorName: 'Jane',
  donorEmail: 'jane@example.com',
  category: 'Tithe',
  paystackStatus: 'pending',
  verifiedAt: null,
  createdAt: new Date(),
};

function setup(updateCounts: number[] = [1]) {
  const prisma = {
    givingRecord: {
      findUnique: jest.fn().mockResolvedValue(record),
      updateMany: jest.fn().mockImplementation(() =>
        Promise.resolve({ count: updateCounts.shift() ?? 0 }),
      ),
    },
  };
  const mail = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const config = {
    get: jest.fn((key: string) => ({
      DEFAULT_TENANT_ID: 'tenant-1',
      PAYSTACK_SECRET_KEY: 'secret-key',
      FRONTEND_URL: 'https://church.test',
    })[key]),
  };
  return {
    service: new GivingService(prisma as never, mail as never, config as never),
    prisma,
    mail,
  };
}

function mockVerification(data: Record<string, unknown>) {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ status: true, data }),
  } as never);
}

describe('GivingService confirmation', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects success when Paystack amount, currency, or reference differs', async () => {
    const { service, prisma, mail } = setup();
    mockVerification({
      status: 'success',
      reference: 'ehc-ref',
      amount: 499_999,
      currency: 'NGN',
    });

    await expect(service.verify('ehc-ref')).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.givingRecord.updateMany).not.toHaveBeenCalled();
    expect(mail.dispatch).not.toHaveBeenCalled();
  });

  it('queues one receipt when verify and webhook-style confirmations race/retry', async () => {
    const { service, prisma, mail } = setup([1, 0]);
    mockVerification({
      status: 'success',
      reference: 'ehc-ref',
      amount: 500_000,
      currency: 'NGN',
    });

    await service.verify('ehc-ref');
    await service.verify('ehc-ref');

    expect(prisma.givingRecord.updateMany).toHaveBeenCalledTimes(2);
    expect(mail.dispatch).toHaveBeenCalledTimes(1);
  });
});
