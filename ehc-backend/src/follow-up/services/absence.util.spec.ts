import { summariseAbsence, type CountedService } from './absence.util';

const day = (iso: string) => new Date(iso).getTime();

// Newest first, as the service passes them.
const services: CountedService[] = [
  { id: 'wed-3', dayEndMs: day('2026-09-24T00:00:00Z') },
  { id: 'sun-2', dayEndMs: day('2026-09-21T00:00:00Z') },
  { id: 'sun-1', dayEndMs: day('2026-09-14T00:00:00Z') },
];

describe('summariseAbsence', () => {
  it('counts missed services out of all of them', () => {
    expect(summariseAbsence(day('2026-01-01T00:00:00Z'), services, new Set(['sun-1']))).toEqual({
      missed: 2,
      total: 3,
      missedLatest: true,
    });
  });

  it('does not count services from before the member joined', () => {
    expect(summariseAbsence(day('2026-09-18T10:00:00Z'), services, new Set(['wed-3']))).toEqual({
      missed: 1,
      total: 2,
      missedLatest: false,
    });
  });

  it('counts the service on the day they joined', () => {
    expect(summariseAbsence(day('2026-09-23T15:00:00Z'), services, new Set())?.total).toBe(1);
  });

  it('is null when no service has counted for them yet', () => {
    expect(summariseAbsence(day('2026-09-30T00:00:00Z'), services, new Set())).toBeNull();
  });
});
