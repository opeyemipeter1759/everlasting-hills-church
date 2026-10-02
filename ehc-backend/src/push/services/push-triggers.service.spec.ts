import { PushTriggersService } from './push-triggers.service';

function makeTriggers() {
  const dispatch = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const triggers = new PushTriggersService(
    {} as never,
    dispatch as never,
    { get: jest.fn().mockReturnValue('tenant-1') } as never,
  );
  return { triggers, dispatch };
}

const announcement = {
  tenantId: 'tenant-1',
  announcementId: 'a-1',
  title: 'Read with us: The Bible in four months',
  body: 'Six readings a day.',
  audience: 'all',
};

describe('PushTriggersService.onAnnouncementPublished', () => {
  it('opens the dashboard when the announcement does not point anywhere else', async () => {
    const { triggers, dispatch } = makeTriggers();

    await triggers.onAnnouncementPublished(announcement);

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      'announcements',
      { tenantId: 'tenant-1', userIds: undefined },
      expect.objectContaining({ url: '/dashboard', tag: 'announcement-a-1' }),
    );
  });

  it('opens where the announcement points, such as a plan shared with the church', async () => {
    const { triggers, dispatch } = makeTriggers();

    await triggers.onAnnouncementPublished({
      ...announcement,
      url: '/dashboard/reading/plans?plan=bible-in-four-months',
    });

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      'announcements',
      expect.anything(),
      expect.objectContaining({ url: '/dashboard/reading/plans?plan=bible-in-four-months' }),
    );
  });
});
