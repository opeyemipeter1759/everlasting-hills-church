import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { DiscussionResponseDto, NoteDto, ProgressDto, ReactionDto } from '../dto/sermon-interaction.dto';
import { SermonInteractionsService } from '../services/sermon-interactions.service';

/** Member interactions with a sermon — authenticated; memberId comes from JWT (no IDOR). */
@ApiTags('sermons')
@Controller('sermons')
export class SermonsInteractionsController {
  constructor(private readonly interactions: SermonInteractionsService) {}

  @Get('me/:sermonId/context')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My context for a sermon (reaction/bookmark/note/progress)' })
  getMyContext(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    return this.interactions.getMemberContext(user.userId, sermonId);
  }

  @Post('me/:sermonId/reaction')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ReactionDto })
  @ApiOperation({ summary: 'Set my reaction on a sermon' })
  upsertReaction(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string, @Body() body: ReactionDto) {
    if (!user.memberId) return null;
    return this.interactions.upsertReaction(user.memberId, sermonId, body.type);
  }

  @Post('me/:sermonId/bookmark')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle my bookmark on a sermon' })
  toggleBookmark(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string) {
    if (!user.memberId) return false;
    return this.interactions.toggleBookmark(user.memberId, sermonId);
  }

  @Post('me/:sermonId/note')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: NoteDto })
  @ApiOperation({ summary: 'Save my note on a sermon' })
  upsertNote(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string, @Body() body: NoteDto) {
    if (!user.memberId) return null;
    return this.interactions.upsertNote(user.memberId, sermonId, body.content);
  }

  @Post('me/:sermonId/progress')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ProgressDto })
  @ApiOperation({ summary: 'Save my playback progress' })
  saveProgress(@CurrentUser() user: AuthUser, @Param('sermonId') sermonId: string, @Body() body: ProgressDto) {
    if (!user.memberId) return null;
    return this.interactions.saveProgress(user.memberId, sermonId, body.positionSec, body.completed ?? false);
  }

  @Post('me/questions/:questionId/response')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: DiscussionResponseDto })
  @ApiOperation({ summary: 'Answer a reflection question (upserts my response)' })
  answerDiscussionQuestion(
    @CurrentUser() user: AuthUser,
    @Param('questionId') questionId: string,
    @Body() body: DiscussionResponseDto,
  ) {
    if (!user.memberId) return null;
    return this.interactions.upsertDiscussionResponse(user.memberId, questionId, body.content);
  }
}
