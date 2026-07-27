import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { SendDirectMessageDto } from '../dto/sermon-interaction.dto';
import { SermonDirectMessageService } from '../services/sermon-direct-message.service';

@ApiTags('sermons')
@Controller('sermons')
export class SermonsDirectMessageController {
  constructor(private readonly directMessages: SermonDirectMessageService) {}

  @Post('me/:sermonId/direct-messages')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: SendDirectMessageDto })
  @ApiOperation({ summary: 'Send a private note or question about a sermon to another member' })
  sendDirectMessage(
    @CurrentUser() user: AuthUser,
    @Param('sermonId') sermonId: string,
    @Body() body: SendDirectMessageDto,
  ) {
    if (!user.memberId) return null;
    return this.directMessages.sendDirectMessage(user.memberId, sermonId, body);
  }

  @Get('me/:sermonId/direct-messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My private notes/questions (sent + received) for a sermon' })
  getMyDirectMessages(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    if (!user.memberId) return [];
    return this.directMessages.getSermonDirectMessages(user.memberId, sermonId);
  }
}
