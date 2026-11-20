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
import { CoupleAccessService } from './documents/couple-access.service';
import { CoupleDocumentsController } from './documents/couple-documents.controller';
import { CoupleDocumentsService } from './documents/couple-documents.service';
import { DocumentCrypto } from './documents/document-crypto';
import { DocumentDispatchService } from './documents/document-dispatch.service';
import { DocumentLettersService } from './documents/document-letters.service';
import { DocumentMailer } from './documents/document-mailer';
import { DocumentStore, GcsDocumentStore } from './documents/document-storage';
import { DocumentsAdminService } from './documents/documents-admin.service';
import { DocumentsConfigService } from './documents/documents-config';
import { PremaritalDocumentsController } from './documents/documents.controller';
import { LetterRenderer } from './documents/letter-renderer';
import { UploadInspector } from './documents/upload-inspector';

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
    CoupleDocumentsController,
    PremaritalDocumentsController,
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
    DocumentsConfigService,
    LetterRenderer,
    DocumentCrypto,
    { provide: DocumentStore, useClass: GcsDocumentStore },
    UploadInspector,
    DocumentMailer,
    DocumentLettersService,
    CoupleAccessService,
    CoupleDocumentsService,
    DocumentDispatchService,
    DocumentsAdminService,
  ],
  exports: [SessionsService],
})
export class PremaritalModule {}
