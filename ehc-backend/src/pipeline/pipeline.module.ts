import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PipelineRepository } from './pipeline.repository';

/** The first-timer pipeline: the one source of follow-up rows and counts. Global so every module reads the same numbers. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [PipelineRepository],
  exports: [PipelineRepository],
})
export class PipelineModule {}
