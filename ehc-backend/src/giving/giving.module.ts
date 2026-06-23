import { Module } from '@nestjs/common';
import { GivingController } from './giving.controller';
import { GivingService } from './giving.service';

/**
 * Online giving (Paystack). PrismaService and MailDispatcher come from their
 * global modules; no extra imports needed.
 */
@Module({
  controllers: [GivingController],
  providers: [GivingService],
})
export class GivingModule {}
