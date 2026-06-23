import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { InboxService } from './inbox.service';

/**
 * Authenticated user's notification inbox. Every route is scoped to the
 * caller's own profile (global JwtAuthGuard provides req.user).
 */
@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (latest 50)' })
  list(@CurrentUser() user: AuthUser) {
    return this.inbox.listForProfile(user.profileId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count my unread notifications' })
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.inbox.unreadCount(user.profileId) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification read' })
  async markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.inbox.markRead(user.profileId, id);
    return { ok: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all my notifications read' })
  async markAllRead(@CurrentUser() user: AuthUser) {
    const count = await this.inbox.markAllRead(user.profileId);
    return { ok: true, count };
  }
}
