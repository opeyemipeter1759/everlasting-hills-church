import { Body, Controller, Delete, Get, Header, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminReadingService } from './services/admin-reading.service';
import { ClearGoneQuietDto, ClearGoneQuietResultDto } from './dto/admin-reading.dto';

/**
 * Bible reading across the church. Admins can also tidy it: remove one
 * member's plan, or clear gone quiet in one step, confirmed by number. Both
 * keep the member's reading history.
 *
 * ADMIN admits ADMIN, ADMIN_HEAD, PASTOR and SUPER_ADMIN, the same set that
 * reads the service-team roster. A member's own progress stays on the
 * me/reading-plan routes; nothing here can change it.
 */
@ApiTags('reading-plans')
@Controller('reading-monitor')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AdminReadingController {
  constructor(private readonly service: AdminReadingService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'How every active member is reading: plans, progress, last reading and recent activity (ADMIN+)',
  })
  overview() {
    return this.service.overview();
  }

  @Delete('subscriptions/:id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: "Remove one member's plan; the days they read stay in their history (ADMIN+)",
  })
  removePlan(@Param('id') id: string) {
    return this.service.removePlan(id);
  }

  @Post('clear-gone-quiet')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Remove the plans of members who have gone quiet, keeping plans started this week and all reading history (ADMIN+)',
  })
  @ApiCreatedResponse({ type: ClearGoneQuietResultDto })
  clearGoneQuiet(@Body() body: ClearGoneQuietDto) {
    return this.service.clearGoneQuiet(body.expectedPlans);
  }
}
