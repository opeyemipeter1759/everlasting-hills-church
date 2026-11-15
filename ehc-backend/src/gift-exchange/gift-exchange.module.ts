import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GiftExchangeController } from './gift-exchange.controller';
import { GiftExchangeAdminController } from './gift-exchange-admin.controller';
import { GiftExchangeService } from './gift-exchange.service';
import { GiftExchangeAdminService } from './gift-exchange-admin.service';

/** Gift exchange: members show interest with one tap; admins review the list. No pairing yet. */
@Module({
  imports: [PrismaModule],
  controllers: [GiftExchangeController, GiftExchangeAdminController],
  providers: [GiftExchangeService, GiftExchangeAdminService],
})
export class GiftExchangeModule {}
