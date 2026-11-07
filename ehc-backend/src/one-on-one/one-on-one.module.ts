import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { OneOnOneController } from './one-on-one.controller';
import { OneOnOnePublicController } from './one-on-one-public.controller';
import { OneOnOneService } from './one-on-one.service';
import { OneOnOneRequestsService } from './one-on-one-requests.service';
import { OneOnOneNotifyService } from './one-on-one-notify.service';
import { OneOnOneCalendarService } from './one-on-one-calendar.service';
import { OneOnOneLinksService } from './one-on-one-links.service';
import { OneOnOneSweepService } from './one-on-one-sweep.service';

@Module({
  imports: [CalendarModule],
  controllers: [OneOnOneController, OneOnOnePublicController],
  providers: [
    OneOnOneService,
    OneOnOneRequestsService,
    OneOnOneNotifyService,
    OneOnOneCalendarService,
    OneOnOneLinksService,
    OneOnOneSweepService,
  ],
  exports: [OneOnOneSweepService, OneOnOneRequestsService],
})
export class OneOnOneModule {}
