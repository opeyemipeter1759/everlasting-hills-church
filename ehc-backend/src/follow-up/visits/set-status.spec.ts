import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { setStatusSchema } from './visit-day.schema';

const config = { get: () => 'tenant' } as never;
const actor = { userId: 'u1', profileId: 'p1' } as never;

function setup(status: string, stage: string | null = null) {
  const prisma = { visitor: { update: jest.fn() }, auditLog: { create: jest.fn() } };
  const pipeline = { one: jest.fn().mockResolvedValue({ visitorId: 'v1', status, stage, statusOverride: null }) };
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
    await expect(setup('INTEGRATED', 'CONFIRMED').svc.setStatus(actor, 'v1', 'FIRST_TIMER', async () => true)).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup('OPTED_OUT').svc.setStatus(actor, 'v1', 'FIRST_TIMER')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets the Integration Team mark an integrated member Away, and back to Integrated', async () => {
    const away = setup('INTEGRATED', 'CONFIRMED');
    await away.svc.setStatus(actor, 'v1', 'AWAY', async () => true);
    expect(away.prisma.visitor.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ statusOverride: 'AWAY' }) }));
    const back = setup('AWAY', 'CONFIRMED');
    await back.svc.setStatus(actor, 'v1', null, async () => true);
    expect(back.prisma.visitor.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ statusOverride: null }) }));
  });

  it('moves an integrated member from Away to EHC Remote Church, and keeps it for the integrated', async () => {
    const remote = setup('AWAY', 'CONFIRMED');
    await remote.svc.setStatus(actor, 'v1', 'REMOTE', async () => true);
    expect(remote.prisma.visitor.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ statusOverride: 'REMOTE' }) }));
    await expect(setup('SECOND_TIMER').svc.setStatus(actor, 'v1', 'REMOTE')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps anyone off the Integration Team from marking an integrated member Away', async () => {
    const { svc, prisma } = setup('INTEGRATED', 'CONFIRMED');
    await expect(svc.setStatus(actor, 'v1', 'AWAY', async () => false)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.visitor.update).not.toHaveBeenCalled();
  });

  it('accepts only the statuses the board may set', () => {
    expect(setStatusSchema.safeParse({ status: 'FOURTH_TIMER' }).success).toBe(true);
    expect(setStatusSchema.safeParse({ status: null }).success).toBe(true);
    expect(setStatusSchema.safeParse({ status: 'INTEGRATED' }).success).toBe(false);
    expect(setStatusSchema.safeParse({ status: 'OPTED_OUT' }).success).toBe(false);
  });
});
