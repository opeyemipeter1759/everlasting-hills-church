import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('admin')
@Controller('admin')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('first-timer/pipeline')
  @ApiOperation({ summary: 'Get first-timer pipeline stats' })
  async getFirstTimerPipeline() {
    return this.analyticsService.getFirstTimerPipeline();
  }
}
