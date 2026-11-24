import { Module } from '@nestjs/common';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import { CmsRevalidateService } from '../cms/services/cms-revalidate.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgramsAdminController } from './programs-admin.controller';
import { ProgramsAdminService } from './programs-admin.service';
import { ProgramsPublicController } from './programs-public.controller';
import { ProgramsPublicService } from './programs-public.service';

/**
 * Programs: the identity and rhythm of each ministry meeting (Prayer Watch,
 * Dew of Heaven, Furnace...). Separate from Gatherings, which are concrete
 * online meetings; a program may link to one later.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ProgramsPublicController, ProgramsAdminController],
  providers: [ProgramsPublicService, ProgramsAdminService, IcsBuilderService, CmsRevalidateService],
})
export class ProgramsModule {}
