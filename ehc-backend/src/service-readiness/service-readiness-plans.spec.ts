import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import { ServiceReadinessUpdatesService } from './service-readiness-updates.service';

const config = { get: () => 'tenant' };
const actor = (over: Record<string, unknown> = {}) =>
  ({ userId: 'auth', email: 'a@b.c', role: Role.MEMBER, effectiveRoles: [Role.MEMBER], unitLeadOf: [], hodOf: [], headUsher: false,
    profileId: 'p-head', memberId: 'm-head', tenantId: null, ...over }) as never;

function build(opts: { heads?: { unitId: string }[]; state?: string } = {}) {
  const record = { id: 'r1', state: opts.state ?? 'NOT_STARTED', Unit: { name: 'Projection' }, Service: { serviceType: 'SUNDAY' } };
  const prisma = {
    serviceReadiness: { findFirst: jest.fn().mockResolvedValue(record), update: jest.fn().mockReturnValue('update') },
    readinessUpdate: { create: jest.fn().mockReturnValue('create') },
    unitMember: { findMany: jest.fn().mockResolvedValue(opts.heads ?? [{ unitId: 'u-av' }]) },
    unit: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const notify = { planSubmitted: jest.fn().mockResolvedValue(undefined), statusUpdated: jest.fn().mockResolvedValue(undefined) };
  const svc = new ServiceReadinessPlansService(prisma as never, {} as never, notify as never, config as never);
  const updates = new ServiceReadinessUpdatesService(prisma as never, notify as never, config as never);
  return { svc, updates, prisma, notify };
}

describe('a unit submitting its plan', () => {
  it('saves it as submitted, clears any approval, and emails the administrators', async () => {
    const { svc, prisma, notify } = build();
    await expect(svc.savePlan(actor(), 's1', 'u-av', { workers: ' Ada, Tunde ', support: 'HDMI cable' })).resolves.toEqual({ saved: true });
    expect(prisma.serviceReadiness.update.mock.calls[0][0].data).toMatchObject({
      workers: 'Ada, Tunde', state: 'CONFIRMED', confirmedById: 'p-head', approvedAt: null, approvedById: null,
    });
    expect(notify.planSubmitted).toHaveBeenCalledWith(expect.objectContaining({ unitName: 'Projection', changed: false, needs: 'HDMI cable' }));
  });

  it('tells the administrators when a submitted plan is changed', async () => {
    const { svc, notify } = build({ state: 'CONFIRMED' });
    await svc.savePlan(actor(), 's1', 'u-av', {});
    expect(notify.planSubmitted).toHaveBeenCalledWith(expect.objectContaining({ changed: true }));
  });

  it("refuses someone who doesn't lead the unit", async () => {
    const { svc } = build({ heads: [] });
    await expect(svc.savePlan(actor(), 's1', 'u-av', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets the Church Administrator submit for any unit', async () => {
    const { svc } = build({ heads: [] });
    await expect(svc.savePlan(actor({ effectiveRoles: [Role.MEMBER, Role.ADMIN_HEAD] }), 's1', 'u-av', {})).resolves.toEqual({ saved: true });
  });
});

describe('a unit posting an update', () => {
  it('records a blocker and emails the administrators', async () => {
    const { updates, prisma, notify } = build({ state: 'CONFIRMED' });
    await expect(updates.postUpdate(actor(), 's1', 'u-av', { status: 'BLOCKED', note: ' Projector bulb blown ' })).resolves.toEqual({
      saved: true, status: 'BLOCKED',
    });
    expect(prisma.serviceReadiness.update.mock.calls[0][0].data).toMatchObject({ status: 'BLOCKED', blocker: 'Projector bulb blown' });
    expect(prisma.$transaction).toHaveBeenCalledWith(['create', 'update']);
    expect(notify.statusUpdated).toHaveBeenCalledWith(expect.objectContaining({ blocked: true, note: 'Projector bulb blown' }));
  });

  it('clears the blocker once the unit says everything is ready', async () => {
    const { updates, prisma } = build({ state: 'CONFIRMED' });
    await updates.postUpdate(actor(), 's1', 'u-av', { status: 'READY' });
    expect(prisma.serviceReadiness.update.mock.calls[0][0].data).toMatchObject({ status: 'READY', blocker: null });
  });

  it('needs the plan first, and a blocker must say what it is', async () => {
    await expect(build().updates.postUpdate(actor(), 's1', 'u-av', { status: 'READY' })).rejects.toBeInstanceOf(BadRequestException);
    const submitted = build({ state: 'CONFIRMED' });
    await expect(submitted.updates.postUpdate(actor(), 's1', 'u-av', { status: 'BLOCKED', note: '  ' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('approving a plan', () => {
  it('records who approved it', async () => {
    const { updates, prisma } = build({ state: 'CONFIRMED' });
    await expect(updates.approve(actor({ profileId: 'p-admin' }), 's1', 'u-av')).resolves.toEqual({ approved: true });
    expect(prisma.serviceReadiness.update.mock.calls[0][0].data).toMatchObject({ approvedById: 'p-admin' });
  });

  it('refuses a plan that has not been submitted', async () => {
    await expect(build().updates.approve(actor(), 's1', 'u-av')).rejects.toBeInstanceOf(BadRequestException);
  });
});
