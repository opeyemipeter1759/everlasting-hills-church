import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { OutboxRegistry } from './outbox.registry';
import { OutboxService } from './outbox.service';

/** The notification outbox and its event registry. Global: any module records events and registers handlers. */
@Global()
@Module({
  imports: [PrismaModule, PushModule],
  providers: [OutboxRegistry, OutboxService],
  exports: [OutboxRegistry, OutboxService],
})
export class OutboxModule {}
