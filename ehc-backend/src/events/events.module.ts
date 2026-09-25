import { Module } from '@nestjs/common';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { CmsModule } from '../cms/cms.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [CmsModule, AnnouncementsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
