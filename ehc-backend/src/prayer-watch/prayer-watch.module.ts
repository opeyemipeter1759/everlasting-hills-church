import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { PrayerWatchController } from './prayer-watch.controller';
import { PrayerWatchService } from './prayer-watch.service';
import { PrayerWatchStatsService } from './prayer-watch-stats.service';

@Module({
  imports: [CalendarModule],
  controllers: [PrayerWatchController],
  providers: [PrayerWatchService, PrayerWatchStatsService],
  exports: [PrayerWatchService],
})
export class PrayerWatchModule {}
