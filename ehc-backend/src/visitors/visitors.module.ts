import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';
import { FirstTimerTeamController } from './first-timer-team.controller';
import { FirstTimerTeamAccess } from './first-timer-team.access';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [FirstTimerTeamController, VisitorsController],
  providers: [VisitorsService, VisitorBulkImportService, FirstTimerTeamAccess],
})
export class VisitorsModule {}
