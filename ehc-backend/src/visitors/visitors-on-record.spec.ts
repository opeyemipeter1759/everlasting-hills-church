import { countVisitorsOnRecord, visitorsOnRecord } from './visitors-on-record';

function prisma(converted: string[], existing: string[]) {
  return {
    visitor: {
      findMany: jest.fn().mockResolvedValue(converted.map((id) => ({ convertedToMemberId: id }))),
      count: jest.fn().mockResolvedValue(181),
    },
    member: { findMany: jest.fn().mockResolvedValue(existing.map((id) => ({ id }))) },
  };
}

describe('visitorsOnRecord', () => {
  it('keeps first timers without an account, and those whose account still exists', async () => {
    // m3's account was deleted, so its form drops out; m1 filled the form twice.
    const db = prisma(['m1', 'm1', 'm2', 'm3'], ['m1', 'm2']);

    const where = await visitorsOnRecord(db as never, 't1');

    expect(db.member.findMany).toHaveBeenCalledWith({ where: { tenantId: 't1', id: { in: ['m1', 'm2', 'm3'] } }, select: { id: true } });
    expect(where).toEqual({ tenantId: 't1', archivedAt: null, OR: [{ convertedAt: null }, { convertedToMemberId: { in: ['m1', 'm2'] } }] });
  });

  it('skips the member lookup when nobody has been given an account', async () => {
    const db = prisma([], []);

    await expect(visitorsOnRecord(db as never, 't1')).resolves.toEqual({
      tenantId: 't1',
      archivedAt: null,
      OR: [{ convertedAt: null }, { convertedToMemberId: { in: [] } }],
    });
    expect(db.member.findMany).not.toHaveBeenCalled();
  });

  it('counts the forms that are on record', async () => {
    const db = prisma(['m1'], ['m1']);
    await expect(countVisitorsOnRecord(db as never, 't1')).resolves.toBe(181);
    expect(db.visitor.count.mock.calls[0][0].where.OR[1]).toEqual({ convertedToMemberId: { in: ['m1'] } });
  });
});
