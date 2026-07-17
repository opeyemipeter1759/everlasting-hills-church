import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusReportsController } from './status-reports.controller';
import { StatusReportsService } from './status-reports.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StatusReportsController],
  providers: [StatusReportsService],
})
export class StatusReportsModule {}
