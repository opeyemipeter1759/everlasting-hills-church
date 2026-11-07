import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OverviewService } from './overview.service';

@Module({
  imports: [PrismaModule],
  providers: [OverviewService],
  exports: [OverviewService],
})
export class OverviewModule {}
