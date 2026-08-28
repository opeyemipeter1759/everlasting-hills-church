import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { FollowUpServiceReportsController } from './follow-up-service-reports.controller';
import { FollowUpController } from './follow-up.controller';
import { FollowUpMemberStatusController } from './follow-up-member-status.controller';
import { FollowUpAuthService } from './services/follow-up-auth.service';
import { FollowUpAuditService } from './services/follow-up-audit.service';
import { FollowUpEntryMapperService } from './services/follow-up-entry-mapper.service';
import { FollowUpAbsenteeDetailService } from './services/follow-up-absentee-detail.service';
import { FollowUpReadService } from './services/follow-up-read.service';
import { FollowUpIntakeService } from './services/follow-up-intake.service';
import { FollowUpProgressService } from './services/follow-up-progress.service';
import { FollowUpMemberStatusService } from './services/follow-up-member-status.service';
import { FollowUpPickersService } from './services/follow-up-pickers.service';
import { FollowUpUnitLeaderLookupService } from './services/follow-up-unit-leader-lookup.service';
import { FollowUpAutoSurfaceAbsenteesService } from './services/follow-up-auto-surface-absentees.service';
import { FollowUpAutoSurfaceFirstTimersService } from './services/follow-up-auto-surface-first-timers.service';
import { FollowUpAutoSurfaceService } from './services/follow-up-auto-surface.service';
import { FollowUpAutoAssignService } from './services/follow-up-auto-assign.service';
import { FollowUpNotifyService } from './services/follow-up-notify.service';
import { FollowUpPastorEscalationService } from './services/follow-up-pastor-escalation.service';
import { FollowUpConnectionMatchService } from './services/follow-up-connection-match.service';
import { FollowUpConnectionsService } from './services/follow-up-connections.service';
import { FollowUpServiceReportService } from './services/follow-up-service-report.service';
import { FollowUpGamificationService } from './services/follow-up-gamification.service';
import { FollowUpRemindersService } from './services/follow-up-reminders.service';

@Module({
  imports: [PrismaModule, AuthModule, InboxModule],
  // FollowUpServiceReportsController must be registered before FollowUpController:
  // its `/follow-up/service-reports` (history) route has the same single-segment
  // shape as FollowUpController's `/follow-up/:id` — Express/Nest match routes in
  // registration order, so the more specific literal path must come first.
  controllers: [FollowUpServiceReportsController, FollowUpController, FollowUpMemberStatusController],
  providers: [
    FollowUpAuthService,
    FollowUpAuditService,
    FollowUpEntryMapperService,
    FollowUpAbsenteeDetailService,
    FollowUpReadService,
    FollowUpIntakeService,
    FollowUpProgressService,
    FollowUpMemberStatusService,
    FollowUpPickersService,
    FollowUpUnitLeaderLookupService,
    FollowUpAutoSurfaceAbsenteesService,
    FollowUpAutoSurfaceFirstTimersService,
    FollowUpAutoSurfaceService,
    FollowUpAutoAssignService,
    FollowUpNotifyService,
    FollowUpPastorEscalationService,
    FollowUpConnectionMatchService,
    FollowUpConnectionsService,
    FollowUpServiceReportService,
    FollowUpGamificationService,
    FollowUpRemindersService,
  ],
  // SchedulingService (scheduling.module.ts) runs the daily auto-surface job
  // and the reminder/escalation sweep.
  exports: [FollowUpAutoSurfaceService, FollowUpRemindersService],
})
export class FollowUpModule {}
