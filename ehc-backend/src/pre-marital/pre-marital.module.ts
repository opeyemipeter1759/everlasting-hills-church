import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PreMaritalController } from './pre-marital.controller';
import { PreMaritalService } from './pre-marital.service';

/** Pre-marital counselling: the public application and the pastors' review. */
@Module({
  imports: [PrismaModule],
  controllers: [PreMaritalController],
  providers: [PreMaritalService],
})
export class PreMaritalModule {}
