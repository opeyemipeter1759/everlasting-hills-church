import { BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService rich event persistence', () => {
  const event = {
    id: 'event-1', tenantId: 'tenant-1', slug: 'furnace-2026', title: 'Furnace 2026',
    status: EventStatus.DRAFT, startAt: new Date('2026-10-01T23:00:00.000Z'),
    endAt: new Date('2026-10-31T22:59:59.000Z'), rsvpEnabled: false,
    registrationRequired: false, capacity: null, Sections: [], Schedules: [],
  };
  const tx = {
    event: { create: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn().mockResolvedValue(event) },
    eventSchedule: { deleteMany: jest.fn(), createMany: jest.fn() },
    eventSection: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const prisma = {
    event: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const config = { get: jest.fn().mockReturnValue('tenant-1') };
  const revalidate = { trigger: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findFirst.mockResolvedValue(null);
    tx.event.findUniqueOrThrow.mockResolvedValue(event);
  });

  function service() {
    return new EventsService(
      prisma as never,
      config as never,
      revalidate as never,
    );
  }

  it('creates a backward-compatible basic draft with no child records', async () => {
    await service().create({ title: 'Prayer Night', startAt: '2026-11-01T18:00:00+01:00' });

    expect(tx.event.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: EventStatus.DRAFT, title: 'Prayer Night' }),
    }));
    expect(tx.eventSchedule.createMany).not.toHaveBeenCalled();
    expect(tx.eventSection.createMany).not.toHaveBeenCalled();
  });

  it('creates schedules and validated rich sections transactionally', async () => {
    await service().create({
      title: 'Furnace 2026', startAt: '2026-10-02T00:00:00+01:00', endAt: '2026-10-31T23:59:59+01:00',
      rsvpEnabled: false, registrationRequired: false,
      schedules: [{ title: 'Morning Watch', startTime: '06:00', recurrenceRule: 'DAILY' }],
      sections: [{ type: 'FAQ', content: { items: [{ question: 'When?', answer: 'October 2–31.' }] } }],
    });

    expect(tx.eventSchedule.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ title: 'Morning Watch', startTime: '06:00' })],
    }));
    expect(tx.eventSection.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ type: 'FAQ', isVisible: true })],
    }));
    expect(revalidate.trigger).toHaveBeenCalledWith(
      expect.arrayContaining(['events']),
      expect.arrayContaining(['/', '/events']),
    );
  });

  it('rejects an end date before the start date', async () => {
    await expect(service().create({
      title: 'Invalid event', startAt: '2026-10-10T10:00:00Z', endAt: '2026-10-09T10:00:00Z',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  // An event is not an announcement: publishing one puts it on the events
  // page only. Announcements are written on their own (2026-11-26).
  it('raises no announcement when an event is published', async () => {
    const announcement = { create: jest.fn(), findUnique: jest.fn() };
    Object.assign(prisma, { announcement });
    await service().create({
      title: 'Furnace 2026',
      startAt: '2026-10-02T06:00:00Z',
      status: EventStatus.PUBLISHED,
    });

    expect(announcement.create).not.toHaveBeenCalled();
    expect(tx.event.findUniqueOrThrow).toHaveBeenCalled();
  });
});
