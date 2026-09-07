import { HeadcountReadService } from './headcount-read.service';

/**
 * The usher backlog: services that have happened with nobody's count against
 * them. This is the number an usher opens the app to check, so what it does and
 * does not include matters.
 */
function makeService(now: Date, services: Record<string, unknown>[]) {
  const findMany = jest.fn().mockResolvedValue(services);
  const read = new HeadcountReadService(
    { service: { findMany } } as never,
    { getNow: () => now } as never,
    {} as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { read, findMany };
}

const NOW = new Date('2026-08-27T09:00:00Z');

describe('HeadcountReadService.getPending', () => {
  it('asks only for past, uncancelled services with no headcount', async () => {
    const { read, findMany } = makeService(NOW, []);

    await read.getPending();

    const { where } = findMany.mock.calls[0][0];
    expect(where.scheduledAt).toEqual({ lte: NOW });
    expect(where.cancelledAt).toBeNull();
    expect(where.ServiceHeadcount).toEqual({ is: null });
    expect(where.tenantId).toBe('tenant-1');
  });

  it('hands back the WAT date the record screen expects', async () => {
    // Stored at 23:00Z, which is midnight in Lagos — the service belongs to the
    // 26th here, and deep-linking the UTC date would open the wrong day.
    const { read } = makeService(NOW, [
      {
        id: 's1',
        name: 'Midweek Service',
        serviceType: 'WEDNESDAY',
        scheduledAt: new Date('2026-08-25T23:00:00Z'),
      },
    ]);

    const [pending] = await read.getPending();

    expect(pending.date).toBe('2026-08-26');
    expect(pending.daysAgo).toBe(1);
  });

  it('reports today as zero days old rather than a negative number', async () => {
    const { read } = makeService(NOW, [
      {
        id: 's2',
        name: 'Sunday Service',
        serviceType: 'SUNDAY',
        scheduledAt: new Date('2026-08-27T08:00:00Z'),
      },
    ]);

    expect((await read.getPending())[0].daysAgo).toBe(0);
  });

  it('clamps the limit so a caller cannot ask for the whole table', async () => {
    const { read, findMany } = makeService(NOW, []);

    await read.getPending(5000);
    expect(findMany.mock.calls[0][0].take).toBe(100);

    await read.getPending(0);
    expect(findMany.mock.calls[1][0].take).toBe(1);
  });
});
