import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { SermonMemberStatsService } from '../services/sermon-member-stats.service';
import { SermonPublicReadService } from '../services/sermon-public-read.service';

@ApiTags('sermons')
@Controller('sermons')
export class SermonsMemberStatsController {
  constructor(
    private readonly memberStats: SermonMemberStatsService,
    private readonly publicRead: SermonPublicReadService,
  ) {}

  /**
   * Everything on the member's My Sermons page in one request: their stats,
   * the published library, what they were listening to, and what they saved.
   * A part that fails comes back null and is named in `unavailable`, so the
   * page shows the rest and that part loads itself.
   */
  @Get('me/overview')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "My Sermons page: stats, published sermons, listen history and bookmarks in one request" })
  async getMyOverview(@CurrentUser() user: AuthUser) {
    const unavailable: string[] = [];
    const part = <T>(name: string, run: () => Promise<T>) =>
      run().catch(() => {
        unavailable.push(name);
        return null;
      });
    const [stats, published, history, bookmarks] = await Promise.all([
      part('stats', () => this.memberStats.getMemberSermonStats(user.userId)),
      part('published', () => this.publicRead.getPublishedSermons({})),
      part('history', () => this.memberStats.getMemberListenHistory(user.userId)),
      part('bookmarks', () => this.memberStats.getMemberBookmarks(user.userId)),
    ]);
    return { stats, published, history, bookmarks, unavailable };
  }

}
