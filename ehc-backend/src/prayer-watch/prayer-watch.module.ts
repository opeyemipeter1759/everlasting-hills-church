import { Module } from '@nestjs/common';
import { PrayerWatchController } from './prayer-watch.controller';
import { PrayerWatchService } from './prayer-watch.service';

@Module({
  controllers: [PrayerWatchController],
  providers: [PrayerWatchService],
})
export class PrayerWatchModule {}
