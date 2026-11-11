import { NotFoundException } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { readinessTimes, serviceName, upcomingServiceDays } from './readiness-schedule';
import { ServiceCalendarService } from './service-calendar.service';
import { ServiceReadinessSetupService } from './service-readiness-setup.service';

const config = { get: () => 'tenant' };
// Sunday 15 November 2026 starts at 2026-11-14T23:00Z in Lagos (UTC+1).
const SUNDAY_START = new Date('2026-11-14T23:00:00.000Z');
const WEDNESDAY_START = new Date('2026-11-17T23:00:00.000Z');

describe('readiness deadlines (Administration Manual)', () => {
  it('Sunday: ready by 7:45 am Lagos, plan due 7:45 am the Saturday before', () => {
    const times = readinessTimes(ServiceType.SUNDAY, SUNDAY_START)!;
    expect(times.readyBy.toISOString()).toBe('2026-11-15T06:45:00.000Z');
    expect(times.planDue.toISOString()).toBe('2026-11-14T06:45:00.000Z');
  });

  it('Wednesday: ready by 5:00 pm Lagos, plan due 5:00 pm on Tuesday', () => {
    const times = readinessTimes(ServiceType.WEDNESDAY, WEDNESDAY_START)!;
    expect(times.readyBy.toISOString()).toBe('2026-11-18T16:00:00.000Z');
    expect(times.planDue.toISOString()).toBe('2026-11-17T16:00:00.000Z');
  });

  it('special services have no weekly readiness deadline', () => {
    expect(readinessTimes(ServiceType.SPECIAL, SUNDAY_START)).toBeNull();
  });

  it('lists only Sundays and Wednesdays, starting with today', () => {
    // Wednesday 11 November 2026, 10:00 Lagos.
    const days = upcomingServiceDays(new Date('2026-11-11T09:00:00.000Z'));
    expect(days.map((d) => [d.type, d.dayStart.toISOString()])).toEqual([
      ['WEDNESDAY', '2026-11-10T23:00:00.000Z'],
      ['SUNDAY', '2026-11-14T23:00:00.000Z'],
      ['WEDNESDAY', '2026-11-17T23:00:00.000Z'],
    ]);
  });

  it('names a service the way attendance does', () => {
    expect(serviceName('SUNDAY', SUNDAY_START)).toBe('Sunday Service — Sunday, 15 November 2026');
    expect(serviceName('WEDNESDAY', WEDNESDAY_START)).toBe('Midweek Service — Wednesday, 18 November 2026');
  });
});

describe('ServiceCalendarService', () => {
  it('creates the coming services that are missing and leaves days that already have one', async () => {
    const findFirst = jest.fn()
      .mockResolvedValueOnce({ id: 'already' }) // today (Wednesday) already has its service
      .mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({});
    const svc = new ServiceCalendarService({ service: { findFirst, create } } as never, config as never);

    await expect(svc.ensureUpcoming(new Date('2026-11-11T09:00:00.000Z'))).resolves.toEqual({ created: 2 });
    expect(create.mock.calls.map((c) => [c[0].data.serviceType, c[0].data.scheduledAt.toISOString()])).toEqual([
      ['SUNDAY', '2026-11-14T23:00:00.000Z'],
      ['WEDNESDAY', '2026-11-17T23:00:00.000Z'],
    ]);
  });
});

describe('saving a department’s readiness setup', () => {
  function build(unit: { id: string } | null = { id: 'u1' }) {
    const prisma = {
      unit: { findFirst: jest.fn().mockResolvedValue(unit), update: jest.fn().mockReturnValue('update'), findMany: jest.fn().mockResolvedValue([]) },
      readinessChecklistItem: { deleteMany: jest.fn().mockReturnValue('clear'), createMany: jest.fn().mockReturnValue('create') },
      service: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const calendar = { ensureUpcoming: jest.fn().mockResolvedValue({ created: 0 }) };
    return { svc: new ServiceReadinessSetupService(prisma as never, calendar as never, config as never), prisma };
  }

  it('replaces both checklists in order, dropping blank lines', async () => {
    const { svc, prisma } = build();
    await svc.updateUnit('u1', {
      sundayChecklist: [' Cameras mounted ', '', 'Stream key tested'],
      wednesdayChecklist: ['Laptop charged'],
    });
    const data = prisma.readinessChecklistItem.createMany.mock.calls[0][0].data;
    expect(data.map((i: { serviceType: string; position: number; label: string }) => [i.serviceType, i.position, i.label])).toEqual([
      ['SUNDAY', 0, 'Cameras mounted'],
      ['SUNDAY', 1, 'Stream key tested'],
      ['WEDNESDAY', 0, 'Laptop charged'],
    ]);
    expect(prisma.unit.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledWith(['clear', 'create']);
  });

  it('refuses a unit that does not exist', async () => {
    const { svc } = build(null);
    await expect(
      svc.updateUnit('nope', { sundayChecklist: [], wednesdayChecklist: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
