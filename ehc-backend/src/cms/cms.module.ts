import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsVersionsController } from './cms-versions.controller';
import { CmsMediaController } from './cms-media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { CmsAuditService } from './services/cms-audit.service';
import { CmsRevalidateService } from './services/cms-revalidate.service';
import { CmsPageCoreService } from './services/cms-page-core.service';
import { CmsDraftService } from './services/cms-draft.service';
import { CmsPublishService } from './services/cms-publish.service';
import { CmsVersionsService } from './services/cms-versions.service';
import { CmsPublicReadService } from './services/cms-public-read.service';
import { CmsSiteConfigService } from './services/cms-site-config.service';
import { CmsPreviewService } from './services/cms-preview.service';
import { CmsMediaService } from './services/cms-media.service';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [CmsController, CmsVersionsController, CmsMediaController],
  providers: [
    CmsAuditService,
    CmsRevalidateService,
    CmsPageCoreService,
    CmsDraftService,
    CmsPublishService,
    CmsVersionsService,
    CmsPublicReadService,
    CmsSiteConfigService,
    CmsPreviewService,
    CmsMediaService,
  ],
})
export class CmsModule {}
