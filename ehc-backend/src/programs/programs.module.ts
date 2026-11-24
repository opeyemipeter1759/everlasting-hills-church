import { Module } from '@nestjs/common';
import { IcsBuilderService } from '../calendar/services/ics-builder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgramsPublicController } from './programs-public.controller';
import { ProgramsPublicService } from './programs-public.service';

/**
 * Programs: the identity and rhythm of each ministry meeting (Prayer Watch,
 * Dew of Heaven, Furnace...). Separate from Gatherings, which are concrete
 * online meetings; a program may link to one later.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ProgramsPublicController],
  providers: [ProgramsPublicService, IcsBuilderService],
})
export class ProgramsModule {}
