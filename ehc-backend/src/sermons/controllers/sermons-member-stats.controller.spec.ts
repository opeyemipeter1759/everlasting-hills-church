import type { AuthUser } from '../../auth/types/auth-user';
import { SermonsMemberStatsController } from './sermons-member-stats.controller';

const user = { userId: 'u1' } as AuthUser;

function makeController(failing?: 'published') {
  const memberStats = {
    getMemberSermonStats: jest.fn().mockResolvedValue({ completed: 2, inProgress: 1, bookmarked: 3 }),
    getMemberListenHistory: jest.fn().mockResolvedValue([{ positionSec: 30 }]),
    getMemberBookmarks: jest.fn().mockResolvedValue([{ id: 'b1' }]),
  };
  const publicRead = {
    getPublishedSermons: failing === 'published'
      ? jest.fn().mockRejectedValue(new Error('db down'))
      : jest.fn().mockResolvedValue([{ slug: 's1' }]),
  };
  return { controller: new SermonsMemberStatsController(memberStats as never, publicRead as never), memberStats };
}

describe('GET /sermons/me/overview', () => {
  it('returns the whole My Sermons page in one answer', async () => {
    const { controller, memberStats } = makeController();
    await expect(controller.getMyOverview(user)).resolves.toEqual({
      stats: { completed: 2, inProgress: 1, bookmarked: 3 },
      published: [{ slug: 's1' }],
      history: [{ positionSec: 30 }],
      bookmarks: [{ id: 'b1' }],
      unavailable: [],
    });
    expect(memberStats.getMemberSermonStats).toHaveBeenCalledWith('u1');
  });

  it('leaves a failing part empty and names it, instead of failing the page', async () => {
    const { controller } = makeController('published');
    const overview = await controller.getMyOverview(user);
    expect(overview.published).toBeNull();
    expect(overview.unavailable).toEqual(['published']);
    expect(overview.stats).toEqual({ completed: 2, inProgress: 1, bookmarked: 3 });
  });
});
