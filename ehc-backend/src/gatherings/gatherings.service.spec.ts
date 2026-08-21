import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { GatheringsService } from './gatherings.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user';

const TENANT = 'tenant-test';

function makeService(gatheringMock: Record<string, jest.Mock>, auditMock = jest.fn()) {
  const prisma = {
    recurringGathering: gatheringMock,
    auditLog: { create: auditMock },
  } as unknown as PrismaService;
  const config = { get: jest.fn().mockReturnValue(TENANT) } as unknown as ConfigService;
  return new GatheringsService(prisma, config as never);
}

const actor = { profileId: 'profile-1' } as AuthUser;

/** Prisma hands a DATE column back at UTC midnight. */
const dateCol = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** A daily 05:30 Lagos prayer meeting, anchored well in the past. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'g1',
    title: 'Morning Prayer',
    description: null,
    recurrenceRule: 'FREQ=DAILY',
    startDate: dateCol('2026-01-01'),
    startTime: '05:30',
    durationMinutes: 60,
    timezone: 'Africa/Lagos',
    joinUrl: null,
    isActive: true,
    ...overrides,
  };
}

describe('GatheringsService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listActive', () => {
    it('scopes to the tenant and to active rows', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      await makeService({ findMany }).listActive();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT, isActive: true } }),
      );
    });
  });

  describe('listAll', () => {
    it('scopes to the tenant but keeps inactive rows', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      await makeService({ findMany }).listAll();
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT } }),
      );
    });
  });

  describe('next occurrence', () => {
    it('reports today when the gathering has not started yet', async () => {
      // 02:00Z on the 19th is 03:00 in Lagos, before the 05:30 start.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T02:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row()]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBe('2026-08-19T04:30:00.000Z'); // 05:30 Lagos
      expect(view.isLive).toBe(false);
      expect(view.endsAt).toBeNull();
    });

    it("rolls to tomorrow once today's occurrence has finished", async () => {
      // 10:00Z is 11:00 in Lagos, well past the 05:30–06:30 window.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row()]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBe('2026-08-20T04:30:00.000Z');
      expect(view.isLive).toBe(false);
    });

    it('reports live, with an end time, while an occurrence is running', async () => {
      // 05:00Z is 06:00 in Lagos, half an hour into the meeting.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T05:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row()]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.isLive).toBe(true);
      expect(view.endsAt).toBe('2026-08-19T05:30:00.000Z');
      expect(view.nextOccurrenceAt).toBe('2026-08-19T04:30:00.000Z');
    });

    it('walks local calendar dates, not UTC ones', async () => {
      // 23:30Z on the 19th is already the 20th in Lagos. A UTC-date walk would
      // offer the 19th's 05:30 slot, which is nineteen hours in the past.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T23:30:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row()]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBe('2026-08-20T04:30:00.000Z');
    });

    it('stays live across midnight for an occurrence that runs past it', async () => {
      // 22:00 Lagos, three hours long. At 00:30 Lagos on the 20th, the meeting
      // that began on the 19th is still running.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T23:30:00.000Z'));
      const findMany = jest
        .fn()
        .mockResolvedValue([row({ startTime: '22:00', durationMinutes: 180 })]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.isLive).toBe(true);
      expect(view.nextOccurrenceAt).toBe('2026-08-19T21:00:00.000Z');
    });

    it('skips to the next matching weekday for a weekly rule', async () => {
      // 2026-08-19 is a Wednesday; this rule fires Tuesdays and Thursdays.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
      const findMany = jest
        .fn()
        .mockResolvedValue([row({ recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH' })]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBe('2026-08-20T04:30:00.000Z'); // Thursday
    });

    it('returns no occurrence when the anchor date is still in the future', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row({ startDate: dateCol('2027-01-01') })]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBeNull();
      expect(view.isLive).toBe(false);
    });

    it('returns no occurrence for a rule it cannot expand', async () => {
      // Validation blocks these on write, so this only happens for a row that
      // predates it — and showing nothing beats advertising a guessed time.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row({ recurrenceRule: 'FREQ=MONTHLY' })]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.nextOccurrenceAt).toBeNull();
    });

    it("resolves the wall time in the gathering's own timezone", async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T00:00:00.000Z'));
      const findMany = jest
        .fn()
        .mockResolvedValue([row({ timezone: 'Europe/London', startTime: '09:00' })]);

      const [view] = await makeService({ findMany }).listActive();

      // BST in August, so 09:00 London is 08:00Z.
      expect(view.nextOccurrenceAt).toBe('2026-08-19T08:00:00.000Z');
    });

    it('serialises the anchor date without a time component', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-19T10:00:00.000Z'));
      const findMany = jest.fn().mockResolvedValue([row()]);

      const [view] = await makeService({ findMany }).listActive();

      expect(view.startDate).toBe('2026-01-01');
    });
  });

  describe('create', () => {
    const input = {
      title: 'Morning Prayer',
      recurrenceRule: 'FREQ=DAILY',
      startDate: '2026-01-01',
      startTime: '05:30',
      durationMinutes: 60,
      timezone: 'Africa/Lagos',
      isActive: true,
    };

    it('stamps the tenant and normalises the anchor date to UTC midnight', async () => {
      const create = jest.fn().mockResolvedValue(row());
      await makeService({ create }).create(actor, input);

      const { data } = create.mock.calls[0][0];
      expect(data.tenantId).toBe(TENANT);
      expect(data.startDate.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });

    it('stores omitted optional fields as null rather than undefined', async () => {
      const create = jest.fn().mockResolvedValue(row());
      await makeService({ create }).create(actor, input);

      const { data } = create.mock.calls[0][0];
      expect(data.description).toBeNull();
      expect(data.joinUrl).toBeNull();
    });

    it('writes an audit entry naming the actor', async () => {
      const audit = jest.fn().mockResolvedValue({});
      const create = jest.fn().mockResolvedValue(row());
      await makeService({ create }, audit).create(actor, input);

      expect(audit).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            entity: 'RecurringGathering',
            actorId: 'profile-1',
          }),
        }),
      );
    });

    it('still returns the gathering when the audit write fails', async () => {
      // Auditing is observability, not part of the transaction.
      const audit = jest.fn().mockRejectedValue(new Error('audit table is down'));
      const create = jest.fn().mockResolvedValue(row());

      await expect(makeService({ create }, audit).create(actor, input)).resolves.toMatchObject({
        id: 'g1',
      });
    });
  });

  describe('update', () => {
    it('refuses a gathering belonging to another tenant', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const update = jest.fn();
      const service = makeService({ findFirst, update });

      await expect(service.update(actor, 'foreign', { title: 'Hijacked' })).rejects.toThrow(
        NotFoundException,
      );
      expect(findFirst).toHaveBeenCalledWith({ where: { id: 'foreign', tenantId: TENANT } });
      expect(update).not.toHaveBeenCalled();
    });

    it('only writes the fields that were supplied', async () => {
      const findFirst = jest.fn().mockResolvedValue(row());
      const update = jest.fn().mockResolvedValue(row({ title: 'Evening Prayer' }));

      await makeService({ findFirst, update }).update(actor, 'g1', { title: 'Evening Prayer' });

      const { data } = update.mock.calls[0][0];
      expect(data).toHaveProperty('title', 'Evening Prayer');
      expect(data).not.toHaveProperty('startTime');
      expect(data).not.toHaveProperty('isActive');
    });

    it('applies an explicit null, distinguishing it from an omitted field', async () => {
      const findFirst = jest.fn().mockResolvedValue(row());
      const update = jest.fn().mockResolvedValue(row());

      await makeService({ findFirst, update }).update(actor, 'g1', { joinUrl: null });

      expect(update.mock.calls[0][0].data).toHaveProperty('joinUrl', null);
    });

    it('records both sides of the change in the audit log', async () => {
      const audit = jest.fn().mockResolvedValue({});
      const findFirst = jest.fn().mockResolvedValue(row());
      const update = jest.fn().mockResolvedValue(row({ title: 'Evening Prayer' }));

      await makeService({ findFirst, update }, audit).update(actor, 'g1', {
        title: 'Evening Prayer',
      });

      const { data } = audit.mock.calls[0][0];
      expect(data.action).toBe('UPDATE');
      expect(data.before).toMatchObject({ title: 'Morning Prayer' });
      expect(data.after).toMatchObject({ title: 'Evening Prayer' });
    });
  });

  describe('remove', () => {
    it('refuses a gathering belonging to another tenant', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const del = jest.fn();
      const service = makeService({ findFirst, delete: del });

      await expect(service.remove(actor, 'foreign')).rejects.toThrow(NotFoundException);
      expect(del).not.toHaveBeenCalled();
    });

    it('deletes and audits the prior state', async () => {
      const audit = jest.fn().mockResolvedValue({});
      const findFirst = jest.fn().mockResolvedValue(row());
      const del = jest.fn().mockResolvedValue(row());

      const result = await makeService({ findFirst, delete: del }, audit).remove(actor, 'g1');

      expect(result).toEqual({ id: 'g1', deleted: true });
      expect(audit.mock.calls[0][0].data).toMatchObject({ action: 'DELETE', entityId: 'g1' });
    });
  });
});
