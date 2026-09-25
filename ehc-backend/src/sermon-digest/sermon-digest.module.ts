import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SermonDigestController } from './sermon-digest.controller';
import { SermonDigestService } from './sermon-digest.service';
import { YouTubeServices } from './youtube-services';

/** Sermon summary + Word of the Day from the church's YouTube services. Run by the "sermon-digest" job. */
@Module({
  imports: [AiModule],
  controllers: [SermonDigestController],
  providers: [SermonDigestService, YouTubeServices],
  exports: [SermonDigestService],
})
export class SermonDigestModule {}
