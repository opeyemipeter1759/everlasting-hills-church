import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { OneOnOneController } from './one-on-one.controller';
import { OneOnOneService } from './one-on-one.service';
import { OneOnOneRequestsService } from './one-on-one-requests.service';
import { OneOnOneNotifyService } from './one-on-one-notify.service';

@Module({
  imports: [CalendarModule],
  controllers: [OneOnOneController],
  providers: [OneOnOneService, OneOnOneRequestsService, OneOnOneNotifyService],
})
export class OneOnOneModule {}
