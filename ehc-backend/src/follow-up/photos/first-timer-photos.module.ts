import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { FirstTimerPhotoStorage } from './first-timer-photo-storage.service';
import { FirstTimerPhotosController } from './first-timer-photos.controller';
import { FirstTimerPhotosService } from './first-timer-photos.service';
import { PhotoUrlService } from './photo-url.service';

/**
 * First-timer photos in a private bucket. Imported by FollowUpModule, whose
 * pipeline controller uses PhotoUrlService to sign a page of photos at once.
 * PipelineRepository comes from the global PipelineModule.
 */
@Module({
  imports: [PrismaModule],
  controllers: [FirstTimerPhotosController],
  // FollowUpAuthService is stateless (Prisma and config only), so this module
  // keeps its own instance rather than reaching into FollowUpModule.
  providers: [FirstTimerPhotoStorage, PhotoUrlService, FirstTimerPhotosService, FollowUpAuthService],
  exports: [PhotoUrlService],
})
export class FirstTimerPhotosModule {}
