import { Module } from '@nestjs/common';
import { MessageTemplatesModule } from '../message-templates/message-templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CaseAccess } from './case-access';
import { CaseActionsService } from './case-actions.service';
import { CaseReadsService } from './case-reads.service';
import { CounsellingNotifier } from './counselling-notifier';
import { ModulesService } from './modules.service';
import { PolicyService } from './policy';
import { PremaritalController } from './premarital.controller';
import { PublicApplicationsService } from './public-applications.service';
import { PublicPremaritalController } from './public-premarital.controller';
import { PremaritalSessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/**
 * Pre-marital counselling: the public application, case review, counsellors,
 * sessions, curriculum and wedding approval. Nothing here may use the AI
 * module (an ESLint rule refuses the import).
 */
@Module({
  imports: [PrismaModule, NotificationsModule, MessageTemplatesModule],
  controllers: [
    PublicPremaritalController,
    PremaritalController,
    PremaritalSessionsController,
  ],
  providers: [
    CaseAccess,
    CounsellingNotifier,
    PolicyService,
    ModulesService,
    PublicApplicationsService,
    CaseReadsService,
    CaseActionsService,
    SessionsService,
  ],
  exports: [SessionsService],
})
export class PremaritalModule {}
