import { Module } from '@nestjs/common';
import { OnlineAttendanceController } from './online-attendance.controller';
import { OnlineAttendanceService } from './online-attendance.service';

@Module({
  controllers: [OnlineAttendanceController],
  providers: [OnlineAttendanceService],
})
export class OnlineAttendanceModule {}
