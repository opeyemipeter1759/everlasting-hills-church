import { Body, Controller, Header, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ShareReadingPlanDto, ShareReadingPlanResultDto } from './dto/share-reading-plan.dto';
import { ReadingPlanShareService } from './services/reading-plan-share.service';

/**
 * Sharing a plan with the whole church. ADMIN admits ADMIN, ADMIN_HEAD, PASTOR
 * and SUPER_ADMIN, the same set that writes announcements, because that is
 * what a share is.
 *
 * Its own controller because the catalogue's responses are cached for a year
 * and readable by every member; nothing here may share that treatment.
 */
@ApiTags('reading-plans')
@Controller('reading-plans')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class ReadingPlanShareController {
  constructor(private readonly share: ReadingPlanShareService) {}

  @Post(':planId/share')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Share a published plan with the whole church: in-app notification and push for every member, email if asked (ADMIN+)',
  })
  @ApiCreatedResponse({ type: ShareReadingPlanResultDto })
  shareWithChurch(
    @Param('planId') planId: string,
    @Body() body: ShareReadingPlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.share.shareWithChurch(planId, body, user.profileId);
  }
}
