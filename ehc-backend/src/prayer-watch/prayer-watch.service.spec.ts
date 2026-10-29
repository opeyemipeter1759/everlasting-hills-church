import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrayerWatchService } from './prayer-watch.service';

const watch = {
  id: 'w1',
  title: 'Prayer Watch',
  watchDate: new Date('2026-10-20'),
  telegramLink: 'https://t.me/central',
  Slots: [
    { id: 's1', watchId: 'w1', label: 'First Watch', startTime: '22:00', endTime: '00:00', capacity: 100, whatsappLink: 'https://chat.whatsapp.com/first' },
    { id: 's2', watchId: 'w1', label: 'Second Watch', startTime: '00:00', endTime: '02:00', capacity: 100, whatsappLink: 'https://chat.whatsapp.com/second' },
  ],
};

function setup() {
  const prisma = {
    prayerWatch: {
      findFirst: jest.fn().mockResolvedValue(watch),
      findFirstOrThrow: jest.fn().mockResolvedValue(watch),
      create: jest.fn(),
    },
    prayerSlot: { findFirst: jest.fn().mockResolvedValue(watch.Slots[0]) },
    prayerSignup: {
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((args) => ({ ...args.data, Slot: watch.Slots[0] })),
      update: jest.fn().mockResolvedValue({}),
    },
    prayerFamilyChangeRequest: { findFirst: jest.fn().mockResolvedValue(null) },
    roleGrant: { findMany: jest.fn().mockResolvedValue([]) },
    // Transaction callback form: just runs the callback against `prisma` itself,
    // since every mocked method above is already set up for it.
    $transaction: jest.fn((arg: unknown) => (typeof arg === 'function' ? arg(prisma) : Promise.resolve(arg))),
  };
  const events = { emit: jest.fn() };
  const ics = {};
  const pushDispatch = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const svc = new PrayerWatchService(prisma as never, events as never, ics as never, pushDispatch as never, { get: () => 't1' } as never);
  return { svc, prisma, events, pushDispatch };
}

/** Lets the fire-and-forget approver-notification chain (two awaited mock
 * promises) settle before assertions run. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('PrayerWatchService.createSignup', () => {
  const dto = { slotId: 's1', fullName: 'Ada Lovelace', phone: '0800', email: 'ada@x.com', isWorker: false };

  it('creates the sign-up as PENDING and emails that it is awaiting approval, not confirmed', async () => {
    const { svc, prisma, events } = setup();
    const result = await svc.createSignup(dto);
    expect(result.signup.status).toBe('PENDING');
    expect(prisma.prayerSignup.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }));
    expect(events.emit).toHaveBeenCalledWith('notification.email.send', expect.objectContaining({ to: 'ada@x.com', tag: 'prayer-watch-signup-pending' }));
  });

  it('rejects a second sign-up for a phone already pending or confirmed', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue({ status: 'PENDING' });
    await expect(svc.createSignup(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects once the slot is full of CONFIRMED sign-ups', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.count.mockResolvedValue(100);
    await expect(svc.createSignup(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('pushes everyone who can approve a sign-up (ADMIN_HEAD and above)', async () => {
    const { svc, prisma, pushDispatch } = setup();
    prisma.roleGrant.findMany.mockResolvedValue([{ userId: 'admin1' }, { userId: 'pastor1' }]);
    await svc.createSignup(dto);
    await flush();
    expect(pushDispatch.dispatch).toHaveBeenCalledWith(
      'prayerWatchPendingApproval',
      { userIds: ['admin1', 'pastor1'], tenantId: 't1' },
      expect.objectContaining({ body: expect.stringContaining('Ada Lovelace') }),
    );
  });

  it('skips the push entirely when nobody holds an approver role', async () => {
    const { svc, pushDispatch } = setup();
    await svc.createSignup(dto);
    await flush();
    expect(pushDispatch.dispatch).not.toHaveBeenCalled();
  });
});

describe('PrayerWatchService.decideSignup', () => {
  const pendingSignup = {
    id: 'sg1',
    slotId: 's1',
    watchId: 'w1',
    fullName: 'Ada Lovelace',
    email: 'ada@x.com',
    Slot: { id: 's1', label: 'First Watch', startTime: '22:00', endTime: '00:00', capacity: 100, whatsappLink: 'https://chat.whatsapp.com/first', Watch: { telegramLink: 'https://t.me/central' } },
  };

  it('confirms the sign-up and emails the WhatsApp + Telegram links on approval', async () => {
    const { svc, prisma, events } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(pendingSignup);
    await expect(svc.decideSignup('admin-1', 'sg1', true, {})).resolves.toEqual({ id: 'sg1', status: 'CONFIRMED', slotId: 's1' });
    expect(prisma.prayerSignup.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sg1' }, data: expect.objectContaining({ status: 'CONFIRMED', decidedById: 'admin-1' }) }),
    );
    const [, payload] = events.emit.mock.calls[0];
    expect(payload).toMatchObject({ to: 'ada@x.com', tag: 'prayer-watch-signup-approved' });
    expect(payload.text).toContain('https://t.me/central');
    expect(payload.text).toContain('https://chat.whatsapp.com/first');
  });

  it('declines the sign-up, keeps the reason on record, and emails why', async () => {
    const { svc, prisma, events } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(pendingSignup);
    await expect(svc.decideSignup('admin-1', 'sg1', false, { note: 'Try a quieter hour' })).resolves.toEqual({ id: 'sg1', status: 'DECLINED', slotId: 's1' });
    expect(prisma.prayerSignup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DECLINED', decisionNote: 'Try a quieter hour' }) }),
    );
    expect(events.emit).toHaveBeenCalledWith('notification.email.send', expect.objectContaining({ tag: 'prayer-watch-signup-declined' }));
  });

  it('offers a different watch instead of a flat decline, moving the slot and saying so', async () => {
    const { svc, prisma, events } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(pendingSignup);
    prisma.prayerSlot.findFirst.mockResolvedValue(watch.Slots[1]);
    await expect(svc.decideSignup('admin-1', 'sg1', true, { slotId: 's2' })).resolves.toEqual({ id: 'sg1', status: 'CONFIRMED', slotId: 's2' });
    expect(prisma.prayerSignup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED', slotId: 's2' }) }),
    );
    const [, payload] = events.emit.mock.calls[0];
    expect(payload).toMatchObject({ tag: 'prayer-watch-signup-approved' });
    expect(payload.text).toContain('Second Watch');
    expect(payload.text).toContain("asked for the First Watch");
  });

  it('refuses to offer a watch that is already full', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(pendingSignup);
    prisma.prayerSlot.findFirst.mockResolvedValue(watch.Slots[1]);
    prisma.prayerSignup.count.mockResolvedValue(100);
    await expect(svc.decideSignup('admin-1', 'sg1', true, { slotId: 's2' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s once already decided', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(null);
    await expect(svc.decideSignup('admin-1', 'sg1', true, {})).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PrayerWatchService.listDeclinedSignups', () => {
  it('lists declined sign-ups with the reason, newest decision first', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findMany = jest.fn().mockResolvedValue([
      { id: 'sg1', slotId: 's1', fullName: 'Ada', phone: '0800', email: 'a@x.com', isWorker: false, createdAt: new Date(), decidedAt: new Date(), decisionNote: 'Try again next cycle' },
    ]);
    const res = await svc.listDeclinedSignups();
    expect(res).toEqual([
      expect.objectContaining({ id: 'sg1', decisionNote: 'Try again next cycle', slotLabel: 'First Watch' }),
    ]);
  });
});

describe('PrayerWatchService.getMySignup', () => {
  it('returns null when the member has no active sign-up', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue(null);
    await expect(svc.getMySignup('p1')).resolves.toBeNull();
  });

  it('withholds the WhatsApp and Telegram links while a sign-up is pending', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue({ id: 'sg1', slotId: 's1', status: 'PENDING', fullName: 'Ada', phone: '0800', email: 'a@x.com', isWorker: false, createdAt: new Date() });
    const res = await svc.getMySignup('p1');
    expect(res?.slot.whatsappLink).toBeNull();
    expect(res?.telegramLink).toBeNull();
    expect(res?.signup.status).toBe('PENDING');
  });

  it('reveals both links once confirmed', async () => {
    const { svc, prisma } = setup();
    prisma.prayerSignup.findFirst.mockResolvedValue({ id: 'sg1', slotId: 's1', status: 'CONFIRMED', fullName: 'Ada', phone: '0800', email: 'a@x.com', isWorker: false, createdAt: new Date() });
    const res = await svc.getMySignup('p1');
    expect(res?.slot.whatsappLink).toBe('https://chat.whatsapp.com/first');
    expect(res?.telegramLink).toBe('https://t.me/central');
  });
});
