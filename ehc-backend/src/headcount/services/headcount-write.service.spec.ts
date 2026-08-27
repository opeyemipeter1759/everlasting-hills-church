import { HeadcountWriteService } from './headcount-write.service';

/**
 * A saved headcount is always CONFIRMED.
 *
 * The form used to offer "Save draft" beside "Confirm headcount", and a DRAFT is
 * excluded from getTrend() and the admin comparison — so the quieter of two
 * near-identical buttons produced counts that looked saved, listed in the ushers
 * report, and never reached an attendance report. 21 counts covering 1,101
 * people had accumulated that way before it was noticed.
 */
function makeService(existing: Record<string, unknown> | null) {
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    ...data,
    recordedAt: new Date(),
    updatedAt: new Date(),
  }));
  const update = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    ...existing,
    ...data,
    recordedAt: new Date(),
    updatedAt: new Date(),
  }));
  const prisma = {
    serviceHeadcount: {
      findUnique: jest.fn().mockResolvedValue(existing),
      create,
      update,
    },
  };
  const service = new HeadcountWriteService(
    prisma as never,
    { serviceState: jest.fn().mockReturnValue('ENDED'), getNow: () => new Date() } as never,
    {
      canRecordDate: jest.fn().mockReturnValue(true),
      findServiceForDate: jest.fn().mockResolvedValue({ id: 'svc-1' }),
      createServiceForDate: jest.fn(),
    } as never,
    { serviceOrThrow: jest.fn().mockResolvedValue({ id: 'svc-1' }) } as never,
    { write: jest.fn(), snapshot: jest.fn() } as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { service, create, update };
}

const COUNTS = { men: 30, women: 25, boys: 5, girls: 8, firstTimers: 3 };

describe('HeadcountWriteService status', () => {
  it('confirms a brand new count', async () => {
    const { service, create } = makeService(null);

    const result = await service.upsertByDate('2026-08-23', COUNTS, { id: 'usher-1' });

    expect(create.mock.calls[0][0].data.status).toBe('CONFIRMED');
    expect(result.status).toBe('CONFIRMED');
    // total is computed, never taken from the client
    expect(create.mock.calls[0][0].data.total).toBe(68);
  });

  it('confirms an edit to an existing count', async () => {
    const { service, update } = makeService({
      id: 'hc-1',
      status: 'CONFIRMED',
      total: 60,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    await service.upsertByDate('2026-08-23', COUNTS, { id: 'usher-1' });

    expect(update.mock.calls[0][0].data.status).toBe('CONFIRMED');
  });

  it('promotes a legacy draft on the next save rather than leaving it uncounted', async () => {
    const { service, update } = makeService({
      id: 'hc-1',
      status: 'DRAFT',
      total: 60,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.upsertByDate('2026-08-23', COUNTS, { id: 'usher-1' });

    expect(update.mock.calls[0][0].data.status).toBe('CONFIRMED');
    expect(result.status).toBe('CONFIRMED');
  });

  it('ignores a confirm flag from an older client instead of falling back to DRAFT', async () => {
    const { service, create } = makeService(null);

    await service.upsertByDate('2026-08-23', { ...COUNTS, confirm: false }, { id: 'usher-1' });

    expect(create.mock.calls[0][0].data.status).toBe('CONFIRMED');
  });
});
