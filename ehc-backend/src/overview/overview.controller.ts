import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { MemberOverviewResponseDto } from './dto/member-overview-response.dto';
import { OverviewService } from './overview.service';

@ApiTags('overview')
@Controller('overview')
@ApiBearerAuth('access-token')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('member')
  @ApiOperation({ summary: 'Get member overview' })
  @ApiOkResponse({ type: MemberOverviewResponseDto })
  @ApiUnauthorizedResponse({ description: 'Access token missing or invalid' })
  async getMemberOverview(@CurrentUser() user: AuthUser) {
    return this.overviewService.getMemberOverview(user.userId);
  }
}
