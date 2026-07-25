import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceSelfServiceController } from './controllers/attendance-self-service.controller';
import { ServiceSessionController } from './controllers/service-session.controller';
import { AttendanceStatsController } from './controllers/attendance-stats.controller';
import { AttendanceMemberLookupService } from './services/attendance-member-lookup.service';
import { AttendanceSessionWindowService } from './services/attendance-session-window.service';
import { AttendanceCheckInService } from './services/attendance-checkin.service';
import { AttendanceHistoryService } from './services/attendance-history.service';
import { AttendanceOverviewService } from './services/attendance-overview.service';
import { ServiceSessionManagementService } from './services/service-session-management.service';
import { AttendanceListService } from './services/attendance-list.service';
import { AttendanceExportService } from './services/attendance-export.service';
import { AttendanceStatsService } from './services/attendance-stats.service';
import { AttendanceSummaryService } from './services/attendance-summary.service';
import { AttendanceOverrideService } from './services/attendance-override.service';
import { AttendanceFeedService } from './services/attendance-feed.service';
import { AttendanceAbsenceService } from './services/attendance-absence.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AttendanceSelfServiceController,
    ServiceSessionController,
    AttendanceStatsController,
    AttendanceController,
  ],
  providers: [
    AttendanceMemberLookupService,
    AttendanceSessionWindowService,
    AttendanceCheckInService,
    AttendanceHistoryService,
    AttendanceOverviewService,
    ServiceSessionManagementService,
    AttendanceListService,
    AttendanceExportService,
    AttendanceStatsService,
    AttendanceSummaryService,
    AttendanceOverrideService,
    AttendanceFeedService,
    AttendanceAbsenceService,
  ],
  // SessionsService (sessions.module.ts) depends on AttendanceAbsenceService (to mark
  // absentees when a session auto-closes) and AttendanceSessionWindowService (force-open
  // today's service). Everything else here is attendance-module-internal.
  exports: [AttendanceAbsenceService, AttendanceSessionWindowService],
})
export class AttendanceModule {}
