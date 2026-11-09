import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceComparisonService } from './attendance-comparison.service';
import { AttendanceInsightsService } from './attendance-insights.service';
import { AttendancePageService } from './attendance-page.service';
import type { Period } from './attendance-analytics.utils';

@ApiTags('analytics')
@Controller('analytics')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AttendanceAnalyticsController {
  constructor(
    private readonly page: AttendancePageService,
    private readonly comparison: AttendanceComparisonService,
    private readonly insights: AttendanceInsightsService,
  ) {}

  @Get('attendance-page')
  @ApiOperation({
    summary:
      'Everything on the Attendance Analytics page that follows its filter, in one request — period OR dateFrom+dateTo, plus serviceType',
  })
  getAttendancePage(@Query('period') p?: Period, @Query('dateFrom') df?: string, @Query('dateTo') dt?: string, @Query('serviceType') st?: string) {
    return this.page.load({ period: p, dateFrom: df, dateTo: dt, serviceType: st });
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two date ranges — period or dateFrom+dateTo per side' })
  getCompare(
    @Query('periodA') pA?: string, @Query('dateFromA') dfA?: string, @Query('dateToA') dtA?: string,
    @Query('periodB') pB?: string, @Query('dateFromB') dfB?: string, @Query('dateToB') dtB?: string,
  ) {
    return this.comparison.getComparePeriods({ period: pA, dateFrom: dfA, dateTo: dtA }, { period: pB, dateFrom: dfB, dateTo: dtB });
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Full-year attendance heatmap' })
  getHeatmap(@Query('year') year?: string, @Query('serviceType') st?: string) {
    return this.insights.getHeatmap(year ? Number(year) : new Date().getFullYear(), st);
  }
}
