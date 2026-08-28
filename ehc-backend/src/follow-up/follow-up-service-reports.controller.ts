import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { SendServiceReportDto } from './dto/send-service-report.dto';
import { FollowUpServiceReportService } from './services/follow-up-service-report.service';

/**
 * A team leader's per-service report to the Admin Head and Pastor. A distinct
 * resource from the Master List itself, so it gets its own controller (same
 * convention as splitting off member-status actions).
 */
@ApiTags('follow-up')
@Controller('follow-up/service-reports')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpServiceReportsController {
  constructor(private readonly reports: FollowUpServiceReportService) {}

  @Get()
  @ApiOperation({ summary: "History of sent service reports (MEMBER+, own team's unless unitId omitted for ADMIN+ scope)" })
  @ApiQuery({ name: 'unitId', required: false })
  async history(@CurrentUser() actor: AuthUser, @Query('unitId') unitId?: string) {
    return this.reports.history(actor, unitId);
  }

  @Get(':serviceId/:unitId/draft')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Compile a draft report for one unit + service day — never auto-sent (UNIT_LEAD+ of that unit)' })
  async draft(@CurrentUser() actor: AuthUser, @Param('serviceId') serviceId: string, @Param('unitId') unitId: string) {
    return this.reports.compileDraft(actor, unitId, serviceId);
  }

  @Post(':serviceId/:unitId/send')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: 'Send the report to the Admin Head + Pastor — this closes out that service\'s follow-up work (UNIT_LEAD+ of that unit)' })
  @ApiBody({ type: SendServiceReportDto })
  async send(
    @CurrentUser() actor: AuthUser,
    @Param('serviceId') serviceId: string,
    @Param('unitId') unitId: string,
    @Body() body: SendServiceReportDto,
  ) {
    return this.reports.send(actor, unitId, serviceId, body);
  }
}
