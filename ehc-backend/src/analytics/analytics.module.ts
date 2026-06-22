import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AttendanceAnalyticsController } from './attendance-analytics.controller';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { AttendanceAnalyticsBService } from './attendance-analytics-b.service';
import { AttendanceAnalyticsCService } from './attendance-analytics-c.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AnalyticsController, AttendanceAnalyticsController],
  providers: [AnalyticsService, AttendanceAnalyticsService, AttendanceAnalyticsBService, AttendanceAnalyticsCService],
})
export class AnalyticsModule {}
