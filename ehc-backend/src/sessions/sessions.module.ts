import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
