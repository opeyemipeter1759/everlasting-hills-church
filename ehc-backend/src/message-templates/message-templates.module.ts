import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowUpAuthService } from '../follow-up/services/follow-up-auth.service';
import { DailyEmailBudget } from './email-budget.service';
import { MessageTemplatesController } from './message-templates.controller';
import { MessageTemplatesService } from './message-templates.service';
import { OpeningMessageController } from './opening-message.controller';
import { OpeningMessageService } from './opening-message.service';
import { OpeningQueueService } from './opening-queue.service';

/**
 * Message templates and the opening message to first-timers. PipelineRepository
 * and NotificationsService come from their global modules. FollowUpAuthService
 * is stateless, so this module keeps its own instance rather than reaching into
 * FollowUpModule.
 *
 * Exports OpeningMessageService for the first-timer form, which renders its
 * automatic welcome email from the opening template.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MessageTemplatesController, OpeningMessageController],
  providers: [MessageTemplatesService, OpeningMessageService, OpeningQueueService, DailyEmailBudget, FollowUpAuthService],
  exports: [OpeningMessageService, DailyEmailBudget],
})
export class MessageTemplatesModule {}
