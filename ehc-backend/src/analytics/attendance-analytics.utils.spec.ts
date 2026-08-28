import { svcTypeWhere } from './attendance-analytics.utils';

/**
 * Guards the meaning of "all" for per-member attendance analytics.
 *
 * Nobody is marked absent from a SPECIAL service — watchnights, one-off
 * gatherings, and the placeholder services the usher headcount flow creates for
 * other weekdays. Counting them here divides a handful of present records by
 * itself, reports a 100% rate for a service most of the church was never
 * expected at, and drags every average up with it.
 */
describe('svcTypeWhere', () => {
  it('excludes special services when no type is asked for', () => {
    expect(svcTypeWhere(undefined)).toEqual({ serviceType: { in: ['SUNDAY', 'WEDNESDAY'] } });
    expect(svcTypeWhere('all')).toEqual({ serviceType: { in: ['SUNDAY', 'WEDNESDAY'] } });
    expect(svcTypeWhere('')).toEqual({ serviceType: { in: ['SUNDAY', 'WEDNESDAY'] } });
  });

  it('honours an explicit type, including special', () => {
    expect(svcTypeWhere('sunday')).toEqual({ serviceType: 'SUNDAY' });
    expect(svcTypeWhere('WEDNESDAY')).toEqual({ serviceType: 'WEDNESDAY' });
    expect(svcTypeWhere('special')).toEqual({ serviceType: 'SPECIAL' });
  });

  it('falls back to the weekly services for anything unrecognised', () => {
    expect(svcTypeWhere('tuesday')).toEqual({ serviceType: { in: ['SUNDAY', 'WEDNESDAY'] } });
  });
});
