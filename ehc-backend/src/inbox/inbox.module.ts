import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

/**
 * In-app notifications. Exports InboxService so AnnouncementsModule can fan out
 * broadcasts into per-member notification rows.
 */
@Module({
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
