import { PrayerWatchController } from './prayer-watch.controller';

function makeController(failing?: 'reflections') {
  const prayerWatch = {
    getAdminView: jest.fn().mockResolvedValue({ id: 'w1', slots: [] }),
    listSignups: jest.fn().mockResolvedValue([{ id: 's1' }]),
    listPendingSignups: jest.fn().mockResolvedValue([{ id: 's2' }]),
    listDeclinedSignups: jest.fn().mockResolvedValue([]),
    listReflections: failing === 'reflections'
      ? jest.fn().mockRejectedValue(new Error('db down'))
      : jest.fn().mockResolvedValue([{ id: 'r1' }]),
  };
  const controller = new (PrayerWatchController as unknown as new (...args: unknown[]) => PrayerWatchController)(
    prayerWatch,
    {},
    {},
  );
  return { controller };
}

describe('GET /prayer-watch/admin/manage', () => {
  it('returns the whole Manage tab in one answer', async () => {
    const { controller } = makeController();
    await expect(controller.getManage()).resolves.toEqual({
      watch: { id: 'w1', slots: [] },
      signups: [{ id: 's1' }],
      pending: [{ id: 's2' }],
      declined: [],
      reflections: [{ id: 'r1' }],
      unavailable: [],
    });
  });

  it('leaves a failing part empty and names it, instead of failing the tab', async () => {
    const { controller } = makeController('reflections');
    const manage = await controller.getManage();
    expect(manage.reflections).toBeNull();
    expect(manage.unavailable).toEqual(['reflections']);
    expect(manage.signups).toEqual([{ id: 's1' }]);
  });
});
