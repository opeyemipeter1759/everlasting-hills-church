import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { FirstTimerPhotosModule } from '../follow-up/photos/first-timer-photos.module';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';
import { FirstTimerTeamController } from './first-timer-team.controller';
import { FirstTimerTeamAccess } from './first-timer-team.access';
import { FollowUpRecordController } from './follow-up-record.controller';
import { FollowUpAuthService } from '../follow-up/services/follow-up-auth.service';

@Module({
  imports: [PrismaModule, AttendanceModule, FirstTimerPhotosModule],
  controllers: [FirstTimerTeamController, FollowUpRecordController, VisitorsController],
  providers: [VisitorsService, VisitorBulkImportService, FirstTimerTeamAccess, FollowUpAuthService],
})
export class VisitorsModule {}
