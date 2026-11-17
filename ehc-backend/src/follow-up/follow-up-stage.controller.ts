import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpStageService } from './services/follow-up-stage.service';

/**
 * Opt out and Restore on one first-timer, the manual moves that replace the
 * old status picker. Anyone signed in reaches the routes; the service lets
 * through only the lead of the person's follow-up unit, its department head
 * or an admin, since a guard cannot say "lead of this person's unit".
 */
@ApiTags('follow-up')
@Controller('follow-up/first-timers')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpStageController {
  constructor(private readonly stages: FollowUpStageService) {}

  @Get(':visitorId/actions')
  @ApiOperation({ summary: 'What the viewer may do to this first-timer: reassign, opt out, restore, archive' })
  async actions(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.stages.actions(actor, visitorId);
  }

  @Post(':visitorId/opt-out')
  @HttpCode(200)
  @ApiOperation({ summary: 'Opt a first-timer out of follow-up (lead of their unit, its department head, or ADMIN+)' })
  async optOut(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.stages.optOut(actor, visitorId);
  }

  @Post(':visitorId/restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Put an opted-out first-timer back on the stage they had before (same people as opt out)' })
  async restore(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.stages.restore(actor, visitorId);
  }
}
