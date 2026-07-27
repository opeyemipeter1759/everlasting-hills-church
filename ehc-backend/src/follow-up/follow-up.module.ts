import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
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

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FollowUpController, FollowUpMemberStatusController],
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
  ],
  // SchedulingService (scheduling.module.ts) runs the daily auto-surface job.
  exports: [FollowUpAutoSurfaceService],
})
export class FollowUpModule {}
