import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}
