import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { VisitorBulkImportService } from './services/visitor-bulk-import.service';

@Module({
  imports: [PrismaModule],
  controllers: [VisitorsController],
  providers: [VisitorsService, VisitorBulkImportService],
})
export class VisitorsModule {}
