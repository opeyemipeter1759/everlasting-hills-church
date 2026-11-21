import { BadRequestException } from '@nestjs/common';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { setStatusSchema } from './visit-day.schema';

const config = { get: () => 'tenant' } as never;
const actor = { userId: 'u1', profileId: 'p1' } as never;

function setup(status: string) {
  const prisma = { visitor: { update: jest.fn() }, auditLog: { create: jest.fn() } };
  const pipeline = { one: jest.fn().mockResolvedValue({ visitorId: 'v1', status, statusOverride: null }) };
  return { svc: new FirstTimerVisitsService(prisma as never, pipeline as never, config), prisma };
}

describe('Setting a first-timer’s status by hand', () => {
  it('saves the status, who set it and when, and audits the change', async () => {
    const { svc, prisma } = setup('FIRST_TIMER');
    await svc.setStatus(actor, 'v1', 'AWAY');
    expect(prisma.visitor.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { statusOverride: 'AWAY', statusOverrideAt: expect.any(Date), statusOverrideById: 'p1' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('clears it to follow their visits again', async () => {
    const { svc, prisma } = setup('AWAY');
    await svc.setStatus(actor, 'v1', null);
    expect(prisma.visitor.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { statusOverride: null, statusOverrideAt: null, statusOverrideById: null } });
  });

  it('leaves integrated and opted-out people to their own flows', async () => {
    await expect(setup('INTEGRATED').svc.setStatus(actor, 'v1', 'FIRST_TIMER')).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup('OPTED_OUT').svc.setStatus(actor, 'v1', 'FIRST_TIMER')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts only the statuses the board may set', () => {
    expect(setStatusSchema.safeParse({ status: 'FOURTH_TIMER' }).success).toBe(true);
    expect(setStatusSchema.safeParse({ status: null }).success).toBe(true);
    expect(setStatusSchema.safeParse({ status: 'INTEGRATED' }).success).toBe(false);
    expect(setStatusSchema.safeParse({ status: 'OPTED_OUT' }).success).toBe(false);
  });
});
