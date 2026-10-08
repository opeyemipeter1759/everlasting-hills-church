import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SermonDigestModule } from '../sermon-digest/sermon-digest.module';
import { ActiveFastService } from './active-fast.service';
import { DailyFastEmailService } from './daily-fast-email.service';
import { EmailUnsubscribeController } from './email-unsubscribe.controller';
import { EmailUnsubscribeService } from './email-unsubscribe.service';
import { FastingPushService } from './fasting-push.service';
import { FastingRecapsService } from './fasting-recaps.service';

/** A church fast's messages: session recaps, the 5am email, unsubscribing, and push alerts. */
@Module({
  imports: [PrismaModule, AiModule, NotificationsModule, SermonDigestModule],
  controllers: [EmailUnsubscribeController],
  providers: [ActiveFastService, DailyFastEmailService, EmailUnsubscribeService, FastingPushService, FastingRecapsService],
  exports: [DailyFastEmailService, FastingPushService, FastingRecapsService],
})
export class FastingEmailModule {}
