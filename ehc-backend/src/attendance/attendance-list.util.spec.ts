import { buildAttendanceWhere } from './attendance-list.util';

describe('buildAttendanceWhere', () => {
  it('leaves deactivated members out of the attendance list', () => {
    expect(buildAttendanceWhere('t1', {})).toEqual({ tenantId: 't1', Member: { status: 'ACTIVE' } });
  });

  it('filters by one service', () => {
    expect(buildAttendanceWhere('t1', { serviceId: 's1' })).toMatchObject({ serviceId: 's1' });
  });

  it('filters Sundays in the query, so pages and totals stay right', () => {
    expect(buildAttendanceWhere('t1', { serviceKey: 'sunday' })).toMatchObject({ Service: { serviceType: 'SUNDAY' } });
    expect(buildAttendanceWhere('t1', { serviceKey: 'wednesday' })).toMatchObject({ Service: { serviceType: 'WEDNESDAY' } });
  });

  it('keeps the date range and the service type together', () => {
    const where = buildAttendanceWhere('t1', { serviceKey: 'sunday', date: '2026-11-08' });
    expect(where.Service).toEqual({
      serviceType: 'SUNDAY',
      scheduledAt: { gte: new Date('2026-11-07T23:00:00Z'), lt: new Date('2026-11-08T23:00:00Z') },
    });
  });

  it('filters by gender whatever its casing, alongside the name search', () => {
    const where = buildAttendanceWhere('t1', { gender: 'female', name: 'ada' });
    expect(where.Member).toEqual({
      status: 'ACTIVE',
      gender: { equals: 'FEMALE', mode: 'insensitive' },
      OR: [
        { firstName: { contains: 'ada', mode: 'insensitive' } },
        { lastName: { contains: 'ada', mode: 'insensitive' } },
      ],
    });
  });

  it('finds a member by their full name', () => {
    const where = buildAttendanceWhere('t1', { name: 'Marvel  Angulu ' });
    expect(where.Member).toEqual({
      status: 'ACTIVE',
      AND: ['Marvel', 'Angulu'].map((w) => ({
        OR: [
          { firstName: { contains: w, mode: 'insensitive' } },
          { lastName: { contains: w, mode: 'insensitive' } },
        ],
      })),
    });
  });

  it('filters by status', () => {
    expect(buildAttendanceWhere('t1', { status: 'ABSENT' })).toMatchObject({ present: false });
  });
});
