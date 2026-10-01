import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SermonDigestModule } from '../sermon-digest/sermon-digest.module';
import { ActiveFastService } from './active-fast.service';
import { DailyFastEmailService } from './daily-fast-email.service';
import { EmailUnsubscribeController } from './email-unsubscribe.controller';
import { EmailUnsubscribeService } from './email-unsubscribe.service';
import { FastingRecapsService } from './fasting-recaps.service';

/** The daily email during a church fast: session recaps, the 5am send, and unsubscribing. */
@Module({
  imports: [PrismaModule, AiModule, NotificationsModule, SermonDigestModule],
  controllers: [EmailUnsubscribeController],
  providers: [ActiveFastService, DailyFastEmailService, EmailUnsubscribeService, FastingRecapsService],
  exports: [DailyFastEmailService, FastingRecapsService],
})
export class FastingEmailModule {}
