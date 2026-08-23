import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [VisitorsController],
  providers: [VisitorsService, VisitorBulkImportService],
})
export class VisitorsModule {}
