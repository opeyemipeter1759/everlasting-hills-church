import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HeadcountController } from './headcount.controller';
import { HeadcountClockService } from './services/headcount-clock.service';
import { HeadcountDateService } from './services/headcount-date.service';
import { HeadcountAuditService } from './services/headcount-audit.service';
import { HeadcountReadService } from './services/headcount-read.service';
import { HeadcountWriteService } from './services/headcount-write.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HeadcountController],
  providers: [
    HeadcountClockService,
    HeadcountDateService,
    HeadcountAuditService,
    HeadcountReadService,
    HeadcountWriteService,
  ],
  // AdminService (admin/admin.service.ts) calls HeadcountReadService.getTrend for the
  // dashboard growth chart.
  exports: [HeadcountReadService],
})
export class HeadcountModule {}
