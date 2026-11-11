import { NotFoundException } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { readinessTimes } from './readiness-schedule';
import { ServiceInspectionsService } from './service-inspections.service';

const config = { get: () => 'tenant' };
const actor = { profileId: 'p-admin' } as never;

describe('inspection times', () => {
  it('Sunday: the day before at 8:00 am, and 6:00 am on the day (2 hours before the workers\' service)', () => {
    const t = readinessTimes(ServiceType.SUNDAY, new Date('2026-11-14T23:00:00Z'))!;
    expect(t.inspections.DAY_BEFORE.toISOString()).toBe('2026-11-14T07:00:00.000Z'); // Sat 8:00 Lagos
    expect(t.inspections.ON_THE_DAY.toISOString()).toBe('2026-11-15T05:00:00.000Z'); // Sun 6:00 Lagos
  });

  it('Wednesday: Tuesday 5:30 pm, and 3:30 pm on the day', () => {
    const t = readinessTimes(ServiceType.WEDNESDAY, new Date('2026-11-17T23:00:00Z'))!;
    expect(t.inspections.DAY_BEFORE.toISOString()).toBe('2026-11-17T16:30:00.000Z');
    expect(t.inspections.ON_THE_DAY.toISOString()).toBe('2026-11-18T14:30:00.000Z');
  });

  it('the plan is due just before the day-before inspection', () => {
    const t = readinessTimes(ServiceType.SUNDAY, new Date('2026-11-14T23:00:00Z'))!;
    expect(t.planDue.getTime()).toBeLessThan(t.inspections.DAY_BEFORE.getTime());
  });
});

describe('recording an inspection', () => {
  function build(record: { id: string } | null = { id: 'r1' }) {
    const prisma = {
      serviceReadiness: { findFirst: jest.fn().mockResolvedValue(record) },
      serviceInspection: { upsert: jest.fn().mockResolvedValue({}) },
    };
    return { svc: new ServiceInspectionsService(prisma as never, {} as never, config as never), prisma };
  }

  it('is ready only when every checklist line is ticked', async () => {
    const { svc, prisma } = build();
    await expect(svc.save(actor, 's1', 'u-av', 'ON_THE_DAY', {
      checks: [{ label: 'Cameras mounted', passed: true }, { label: 'Stream key tested', passed: false, note: ' key expired ' }],
    })).resolves.toEqual({ saved: true, result: 'ISSUES' });
    const call = prisma.serviceInspection.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ readinessId_round: { readinessId: 'r1', round: 'ON_THE_DAY' } });
    expect(call.update.checks).toEqual([{ label: 'Cameras mounted', passed: true }, { label: 'Stream key tested', passed: false, note: 'key expired' }]);
    expect(call.update.inspectedById).toBe('p-admin');
  });

  it('uses the inspector\'s yes/no for a department with no checklist yet', async () => {
    const { svc } = build();
    await expect(svc.save(actor, 's1', 'u-av', 'DAY_BEFORE', { checks: [], ready: false })).resolves.toMatchObject({ result: 'ISSUES' });
    await expect(svc.save(actor, 's1', 'u-av', 'DAY_BEFORE', { checks: [] })).resolves.toMatchObject({ result: 'READY' });
  });

  it('refuses a department that is not serving at that service', async () => {
    const { svc } = build(null);
    await expect(svc.save(actor, 's1', 'nope', 'DAY_BEFORE', { checks: [] })).rejects.toBeInstanceOf(NotFoundException);
  });
});
