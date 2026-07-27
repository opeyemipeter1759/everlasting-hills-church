import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { SermonMemberStatsService } from '../services/sermon-member-stats.service';

@ApiTags('sermons')
@Controller('sermons')
export class SermonsMemberStatsController {
  constructor(private readonly memberStats: SermonMemberStatsService) {}

  @Get('me/bookmarks')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My bookmarked sermons' })
  getMyBookmarks(@CurrentUser() user: AuthUser) {
    return this.memberStats.getMemberBookmarks(user.userId);
  }

  @Get('me/history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My listen history' })
  getMyListenHistory(@CurrentUser() user: AuthUser) {
    return this.memberStats.getMemberListenHistory(user.userId);
  }

  @Get('me/stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My sermon stats — completed / in progress / bookmarked counts' })
  getMySermonStats(@CurrentUser() user: AuthUser) {
    return this.memberStats.getMemberSermonStats(user.userId);
  }

  @Get('me/streak')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My weekly sermon streak' })
  getMySermonStreak(@CurrentUser() user: AuthUser) {
    return this.memberStats.getSermonStreak(user.userId);
  }
}
