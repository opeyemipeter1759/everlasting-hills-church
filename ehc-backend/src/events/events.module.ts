import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [CmsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
