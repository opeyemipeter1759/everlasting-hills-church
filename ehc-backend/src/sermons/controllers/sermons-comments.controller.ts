import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { ROLE_LEVELS } from '../../users/role-hierarchy';
import { CreateCommentDto } from '../dto/sermon-interaction.dto';
import { SermonCommentsService } from '../services/sermon-comments.service';

/**
 * Registered AFTER SermonsPublicController in sermons.module.ts: this controller's
 * `:sermonId/comments` and SermonsPublicController's `slug/:slug` are both 2-segment GET
 * routes, so if a sermon's slug were ever literally "comments" they'd be ambiguous —
 * `slug/:slug` must win, matching the original single-controller declaration order.
 */
@ApiTags('sermons')
@Controller('sermons')
export class SermonsCommentsController {
  constructor(private readonly comments: SermonCommentsService) {}

  @Public()
  @Get(':sermonId/comments')
  @ApiOperation({ summary: 'List comments on a sermon (public)' })
  getComments(@Param('sermonId') sermonId: string) {
    return this.comments.getComments(sermonId);
  }

  @Post('me/:sermonId/comments')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateCommentDto })
  @ApiOperation({ summary: 'Post a comment (or reply) on a sermon' })
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('sermonId') sermonId: string,
    @Body() body: CreateCommentDto,
  ) {
    if (!user.memberId) return null;
    return this.comments.createComment(user.memberId, sermonId, body.content, body.parentId);
  }

  @Delete('me/comments/:commentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete my comment (or any comment, if PASTOR+)' })
  deleteComment(@CurrentUser() user: AuthUser, @Param('commentId') commentId: string) {
    if (!user.memberId) return null;
    const isPastor = !!user.role && ROLE_LEVELS[user.role] >= ROLE_LEVELS[Role.PASTOR];
    return this.comments.deleteComment(commentId, { memberId: user.memberId, isPastor });
  }
}
