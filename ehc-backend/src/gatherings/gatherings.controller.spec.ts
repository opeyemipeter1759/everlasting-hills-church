import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { GatheringsController } from './gatherings.controller';
import type { GatheringsService } from './gatherings.service';

/**
 * RolesGuard is registered globally and reads this metadata, so the decorators
 * are the authorization — not a hint about it. A dropped `@Roles` would open
 * every write route to any signed-in member without failing anything else.
 */
describe('GatheringsController authorization', () => {
  const reflector = new Reflector();
  const rolesOn = (target: Function) => reflector.get<Role[] | undefined>(ROLES_KEY, target);

  it('gates the controller at ADMIN', () => {
    expect(rolesOn(GatheringsController)).toEqual([Role.ADMIN]);
  });

  it.each([['create'], ['update'], ['remove'], ['listAll']])(
    'leaves %s on the class-level ADMIN gate',
    (method) => {
      // No method-level override means the class gate applies.
      expect(rolesOn(GatheringsController.prototype[method] as Function)).toBeUndefined();
    },
  );

  it('lowers only the member-facing list to MEMBER', () => {
    expect(rolesOn(GatheringsController.prototype.list)).toEqual([Role.MEMBER]);
  });
});

describe('GatheringsController', () => {
  function makeController(service: Partial<Record<keyof GatheringsService, jest.Mock>>) {
    return new GatheringsController(service as unknown as GatheringsService);
  }

  it('serves the member list from the active-only query', async () => {
    const listActive = jest.fn().mockResolvedValue([]);
    await makeController({ listActive }).list();
    expect(listActive).toHaveBeenCalled();
  });

  it('serves the admin list from the unfiltered query', async () => {
    const listAll = jest.fn().mockResolvedValue([]);
    await makeController({ listAll }).listAll();
    expect(listAll).toHaveBeenCalled();
  });

  it('rejects an invalid recurrence rule before reaching the service', () => {
    const create = jest.fn();
    const controller = makeController({ create });

    expect(() =>
      controller.create({ profileId: 'p1' } as never, {
        title: 'Monthly Vigil',
        recurrenceRule: 'FREQ=MONTHLY',
        startDate: '2026-01-01',
        startTime: '22:00',
      }),
    ).toThrow('Invalid input');
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an empty PATCH body before reaching the service', () => {
    const update = jest.fn();
    const controller = makeController({ update });

    expect(() => controller.update({ profileId: 'p1' } as never, 'g1', {})).toThrow(
      'Invalid input',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('passes the actor through so the write is attributable', async () => {
    const create = jest.fn().mockResolvedValue({});
    const actor = { profileId: 'p1' } as never;

    await makeController({ create }).create(actor, {
      title: 'Morning Prayer',
      recurrenceRule: 'FREQ=DAILY',
      startDate: '2026-01-01',
      startTime: '05:30',
    });

    expect(create).toHaveBeenCalledWith(actor, expect.objectContaining({ title: 'Morning Prayer' }));
  });
});
