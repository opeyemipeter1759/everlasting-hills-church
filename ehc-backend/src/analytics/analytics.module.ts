import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AttendanceAnalyticsController } from './attendance-analytics.controller';
import { AttendanceOverviewService } from './attendance-overview.service';
import { AttendanceComparisonService } from './attendance-comparison.service';
import { AttendanceInsightsService } from './attendance-insights.service';
import { AttendanceAlertsService } from './attendance-alerts.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AnalyticsController, AttendanceAnalyticsController],
  providers: [AnalyticsService, AttendanceOverviewService, AttendanceComparisonService, AttendanceInsightsService, AttendanceAlertsService],
})
export class AnalyticsModule {}
